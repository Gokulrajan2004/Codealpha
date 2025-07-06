const uploadForm = document.getElementById('uploadForm');
const feed = document.getElementById('feed');

// ✅ Show logged-in user's name and profile pic
async function showLoggedInUser() {
  const userId = localStorage.getItem('userId');
  const userSpan = document.getElementById('loggedUser');
  if (!userId) {
    userSpan.textContent = "Guest (Please Login)";
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/users/${userId}`);
    const user = await res.json();
    userSpan.textContent = `@${user.username}`;

    const img = document.getElementById('profilePic');
    if (img) {
      img.src = user.profilePic || 'abc.png';
    }
  } catch (err) {
    userSpan.textContent = "User";
  }
}

// ✅ Upload a post
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userId = localStorage.getItem("userId");
  if (!userId) {
    alert("Please login to upload.");
    return;
  }

  const formData = new FormData(uploadForm);
  formData.append("userId", userId);

  try {
    const res = await fetch('http://localhost:5000/api/posts/create', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Upload failed");
    }

    const result = await res.json();
    alert(result.message || "Post uploaded!");
    uploadForm.reset();
    loadFeed();
  } catch (err) {
    alert("Error uploading post: " + err.message);
  }
});

// ✅ Load all posts into the feed
async function loadFeed() {
  feed.innerHTML = "Loading...";
  try {
    const res = await fetch('http://localhost:5000/api/posts/all');
    const posts = await res.json();
    feed.innerHTML = "";

    posts.forEach(post => {
      const div = document.createElement('div');
      div.className = 'post';
      div.innerHTML = `
        <h3>@${post.userId.username}</h3>
        <p>${post.caption}</p>
        <img src="${post.imageUrl}" alt="Post Image" onerror="this.src='abc.png'">
        <p>
            ❤️ ${post.likes.length} likes
            <button onclick="likePost('${post._id}')">❤️ Like</button>
            <button onclick="deletePost('${post._id}')">🗑️ Delete</button> <!-- 👈 Add this -->
        </p>
        <div class="comments">
          <h4>Comments:</h4>
          ${
            post.comments.map(c => `
              <p><strong>@${c.userId?.username || 'unknown'}:</strong> ${c.text}</p>
            `).join('')
          }

          <!-- Comment Form -->
          <form class="commentForm" data-postid="${post._id}">
            <input type="text" name="text" placeholder="Add a comment..." required>
            <button type="submit">Post</button>
          </form>
        </div>
      `;
      feed.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    feed.innerHTML = "Failed to load posts.";
  }
}

// ✅ Like a post
async function likePost(postId) {
  const userId = localStorage.getItem("userId");
  if (!userId) return alert("Please login to like posts.");

  try {
    const res = await fetch(`http://localhost:5000/api/posts/like/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });

    if (!res.ok) throw new Error("Failed to like post");
    loadFeed();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}
async function deletePost(postId) {
  const confirmDelete = confirm("Are you sure you want to delete this post?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`http://localhost:5000/api/posts/delete/${postId}`, {
      method: 'DELETE'
    });

    const result = await res.json();
    alert(result.message || "Deleted!");
    loadFeed(); // 🔁 Reload feed after deletion
  } catch (err) {
    alert("Error deleting post: " + err.message);
  }
}

// ✅ Comment submit handler
document.addEventListener('submit', async (e) => {
  if (e.target.classList.contains('commentForm')) {
    e.preventDefault();
    const form = e.target;
    const postId = form.dataset.postid;
    const text = form.text.value.trim();
    const userId = localStorage.getItem("userId");

    if (!userId) {
      alert("Please login to comment.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/posts/comment/${postId}`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, text })
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to comment");
      }

      form.reset();
      loadFeed();
    } catch (err) {
      alert(err.message);
    }
  }
});

// ✅ Load profile pic (used on index.html sidebar)
async function loadLoggedUserProfilePic() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;

  try {
    const res = await fetch(`http://localhost:5000/api/users/${userId}`);
    const user = await res.json();
    const img = document.getElementById('profilePic');
    if (img) {
      img.src = user.profilePic || 'abc.png';
    }
  } catch (err) {
    console.error("Couldn't load profile image", err);
  }
}

// ✅ Logout
function logout() {
  localStorage.removeItem("userId");
  window.location.href = "login.html";
}

// ⏬ Initial load
loadFeed();
showLoggedInUser();
loadLoggedUserProfilePic();
