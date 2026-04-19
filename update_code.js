const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./dev.db');

const newCode = "1f27d5a6";

db.serialize(() => {
    // Проверяем текущий код
    db.get("SELECT value FROM Setting WHERE key = 'vk_confirmation_code'", (err, row) => {
        if (row) {
            console.log("Текущий код в БД:", row.value);
        } else {
            console.log("Код в БД не найден, создаем новый");
        }

        // Обновляем или создаем запись
        db.run("INSERT OR REPLACE INTO Setting (key, value) VALUES (?, ?)", ['vk_confirmation_code', newCode], (err) => {
            if (err) {
                console.error("Ошибка обновления:", err.message);
            } else {
                console.log("✅ Код подтверждения успешно обновлен на:", newCode);
            }
            db.close();
        });
    });
});
