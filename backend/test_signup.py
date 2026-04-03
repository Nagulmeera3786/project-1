import requests
import json

def main():
    test_email = "test@example.com"
    test_password = "TestPassword123"

    print("=" * 60)
    print("TESTING SIGNUP ENDPOINT")
    print("=" * 60)

    data = {
        "username": test_email,
        "email": test_email,
        "phone_number": "9876543210",
        "password": test_password
    }

    try:
        response = requests.post(
            'http://localhost:8000/api/auth/signup/',
            json=data,
            timeout=5
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
        print("Backend might not be running. Start it with:")
        print("cd c:\\ABC\\Project\\backend")
        print("python manage.py runserver 0.0.0.0:8000")


if __name__ == '__main__':
    main()
