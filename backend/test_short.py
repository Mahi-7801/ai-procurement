from passlib.context import CryptContext
import bcrypt

print(f"bcrypt version: {bcrypt.__version__}")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

try:
    password = "demo"
    print(f"Testing short password ({len(password)} chars)")
    hashed = pwd_context.hash(password)
    print(f"Hashed: {hashed}")
except Exception as e:
    import traceback
    print(f"Failed: {e}")
    traceback.print_exc()
