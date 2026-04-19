import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function getGroupMembers(offset = 0, count = 1000) {
  const token = await db.setting.findUnique({ where: { key: 'vk_access_token' } });
  const groupId = await db.setting.findUnique({ where: { key: 'vk_group_id' } });
  
  if (!token?.value || !groupId?.value) {
    return { error: 'No token or group_id' };
  }
  
  const url = 'https://api.vk.com/method/groups.getMembers?access_token=' + token.value + '&v=5.131&group_id=' + groupId.value + '&offset=' + offset + '&count=' + count;
  
  try {
    const res = await fetch(url, { method: 'POST' });
    return await res.json();
  } catch (e) {
    return { error: e };
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await db.setting.findUnique({ where: { key: 'vk_access_token' } });
    if (!token?.value) {
      return NextResponse.json({ error: 'No VK token' }, { status: 400 });
    }

    let totalImported = 0;
    let offset = 0;
    const batchSize = 1000;
    const maxMembers = 5000;

    for (offset = 0; offset < maxMembers; offset += batchSize) {
      const data = await getGroupMembers(offset, batchSize);
      
      if (data.error) {
        console.error('VK API error:', data.error);
        break;
      }
      
      const items = data.response?.items || [];
      if (items.length === 0) break;
      
      for (const vkId of items) {
        const existing = await db.subscriber.findUnique({ where: { vkId } });
        if (!existing) {
          await db.subscriber.create({
            data: {
              vkId,
              firstName: 'VK',
              lastName: 'User',
              status: 'active',
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }
          });
          totalImported++;
        }
      }
      
      console.log('Imported batch', offset / batchSize + 1, 'total:', totalImported);
    }

    return NextResponse.json({ success: true, imported: totalImported });
    
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
