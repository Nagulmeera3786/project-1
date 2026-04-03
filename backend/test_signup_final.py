import requests
import json

def main():
    print("=" * 60)
    print("Testing Signup with Email")
    print("=" * 60)

    data = {
        "email": "mrm53451@gmail.com",
        "username": "mrm53451@gmail.com",
        "phone_number": "",
        "password": "SecurePass@2026"
    }

    try:
        response = requests.post(
            'http://localhost:8000/api/auth/signup/',
            json=data,
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        if response.status_code == 201:
            print("✓ Signup successful!")
            print("Check your Gmail inbox for OTP email")
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == '__main__':
    main()
