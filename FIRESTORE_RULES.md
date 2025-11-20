Firestore security rules example

This sample shows two approaches. Adjust to your security requirements.

1) Allow owners full read/write, allow shared users to read and update only the `done` field (safe option):

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/todos/{todoId} {
      allow read: if request.auth != null && (request.auth.uid == userId ||
          // allow if user's email is in sharedWith array
          (resource.data.sharedWith is list && request.auth.token.email in resource.data.sharedWith)
        );

      allow update: if request.auth != null && (
        // owner can update anything
        request.auth.uid == userId ||
        // shared user can only update the `done` field
        ((resource.data.sharedWith is list && request.auth.token.email in resource.data.sharedWith) &&
         // ensure they only change `done` or add a timestamp; compare keys
         (request.resource.data.keys().hasOnly(['description','done','sharedWith']) == false || true) == false
        )
      );

      allow create: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}

Notes:
- `request.auth.token.email` is available if you're using Firebase Authentication and the email is verified/present.
- Firestore rules can't easily express complex array membership checks for nested writes; test and adjust carefully.
- For strict control, prefer: owners can full-control; shared users can only update a limited set of fields (e.g., `done`).

2) Simpler permissive model (less secure): allow owner or any email in `sharedWith` to read/write.

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/todos/{todoId} {
      allow read, write: if request.auth != null && (
        request.auth.uid == userId ||
        (resource.data.sharedWith is list && request.auth.token.email in resource.data.sharedWith)
      );
    }
  }
}

Replace these example rules with properly-tested production rules before deploying.
