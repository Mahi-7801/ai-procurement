import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

host = os.getenv("DB_HOST", "localhost")
user = os.getenv("DB_USER", "root")
password = os.getenv("DB_PASSWORD", "")
port = int(os.getenv("DB_PORT", "3306"))
dbname = os.getenv("DB_NAME", "ai_procurement")

print(f"Connecting to database: {dbname} on {host}:{port}...")

try:
    conn = pymysql.connect(host=host, user=user, password=password, port=port, db=dbname)
    with conn.cursor() as cursor:
        # Check if users table exists
        cursor.execute("SHOW TABLES LIKE 'users'")
        if not cursor.fetchone():
            print("Error: 'users' table does not exist. Please initialize the database correctly.")
            exit(1)

        # Check if vendors table exists
        cursor.execute("SHOW TABLES LIKE 'vendors'")
        if not cursor.fetchone():
            print("Creating 'vendors' table...")
            cursor.execute("""
                CREATE TABLE `vendors` (
                    `id` int(11) NOT NULL AUTO_INCREMENT,
                    `vendor_code` varchar(50) NOT NULL,
                    `vendor_name` varchar(500) NOT NULL,
                    `gstin` varchar(15) DEFAULT NULL,
                    `pan` varchar(10) DEFAULT NULL,
                    `email` varchar(255) DEFAULT NULL,
                    `phone` varchar(20) DEFAULT NULL,
                    `address` text DEFAULT NULL,
                    `is_blacklisted` tinyint(1) DEFAULT '0',
                    `blacklist_reason` text DEFAULT NULL,
                    `user_id` int(11) DEFAULT NULL,
                    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    UNIQUE KEY `ix_vendors_vendor_code` (`vendor_code`),
                    KEY `ix_vendors_id` (`id`),
                    KEY `user_id` (`user_id`),
                    CONSTRAINT `vendors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            print("'vendors' table created.")
        else:
            # Check if user_id column exists
            cursor.execute("DESCRIBE vendors")
            columns = [col[0] for col in cursor.fetchall()]
            if 'user_id' not in columns:
                print("Adding 'user_id' column to 'vendors' table...")
                cursor.execute("ALTER TABLE vendors ADD COLUMN user_id INT(11) DEFAULT NULL")
                cursor.execute("ALTER TABLE vendors ADD CONSTRAINT `vendors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)")
                print("'user_id' column added.")
            else:
                print("'user_id' column already exists in 'vendors' table.")

        conn.commit()
    conn.close()
    print("Database modification completed successfully.")
except pymysql.MySQLError as e:
    print(f"Error modifying database: {e}")
except Exception as ex:
    print(f"Unexpected error: {ex}")
