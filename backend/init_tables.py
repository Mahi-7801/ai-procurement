
import asyncio
from database.connection import init_db

async def main():
    print("Initializing tables in MySQL databases...")
    try:
        await init_db()
        print("Tables created successfully in 'procuresmart_db' and 'historical_procuresmart_db'.")
    except Exception as e:
        print(f"Error initializing tables: {e}")

if __name__ == "__main__":
    asyncio.run(main())
