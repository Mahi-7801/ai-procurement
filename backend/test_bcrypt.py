from passlib.context import CryptContext
import bcrypt

print(f"bcrypt version: {bcrypt.__version__}")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

try:
    password = "a" * 80
    print(f"Testing long password ({len(password)} chars)")
    hashed = pwd_context.hash(password[:72])
    print("Success with truncation")
except Exception as e:
    print(f"Failed with truncation: {e}")

try:
    password = "a" * 80
    print(f"Testing long password without truncation ({len(password)} chars)")
    hashed = pwd_context.hash(password)
    print("Success without truncation")
except Exception as e:
    print(f"Failed without truncation: {e}")
