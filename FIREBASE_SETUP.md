# Firebase + GitHub Pages Setup (MVP)

## 1) Update Firebase config
Edit [js/firebase-web-config.js](/Users/mukulnimker/Documents/GitHub/handmadewithraj/js/firebase-web-config.js):
- `window.FIREBASE_CONFIG`
- `window.ADMIN_EMAILS`

Notes:
- Keep at least one admin email in `ADMIN_EMAILS`.
- If the list is empty, any authenticated Firebase user can access `admin.html`.

## 2) Enable Firebase services
In Firebase Console:
1. Enable **Authentication** -> Email/Password.
2. Enable **Cloud Firestore**.
3. Enable **Cloud Storage**.

## 3) Firestore collections
This MVP uses two collections:
- `products`
- `categories`

### `products` document fields
- `name` (string)
- `description` (string)
- `category` (string slug, example: `keychains`)
- `price` (number)
- `image` (emoji string, optional)
- `image_url` (string URL, optional)
- `featured` (boolean)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### `categories` document fields
- `key` (string slug, example: `baby-sets`)
- `label` (string, example: `Baby Sets`)
- `createdAt` (timestamp)

## 4) Firestore security rules (MVP)
Use allow-listed admin emails for write access.

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email in [
          "owner@example.com"
        ];
    }

    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /categories/{categoryId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
  }
}
```

Replace with your actual admin emails.

## 5) Storage security rules (MVP)
Allow public read for product images, admin-only write:

```txt
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email in [
          "suroopihandlooms@gmail.com"
        ];
    }

    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

## 6) GitHub Pages URLs
- Customer: `https://<username>.github.io/<repo>/`
- Admin: `https://<username>.github.io/<repo>/admin.html`

## 7) Go-live checklist
1. Open customer page and confirm products/categories load.
2. Open `admin.html` and login with allowed admin account.
3. Add category, add product with image URL, edit, delete.
4. Try login with non-allowed account and confirm denied access.
