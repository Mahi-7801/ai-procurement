
import pymysql

def create_databases():
    try:
        # Connect to MySQL (no database specified)
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='',
            port=3307
        )
        cursor = connection.cursor()
        
        # Create databases
        databases = ['procuresmart_db',]
        for db in databases:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db}")
            print(f"Database '{db}' created or already exists.")
            
        cursor.close()
        connection.close()
        return True
    except Exception as e:
        print(f"Error creating databases: {e}")
        return False

if __name__ == "__main__":
    create_databases()
