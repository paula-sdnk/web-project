const Url = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  const postsContainer = document.getElementById("posts-container");
  const loadingPostsMessage = document.getElementById("loading-posts-message");

  if (!postsContainer) {
    console.error("Posts container element not found!");
    if (loadingPostsMessage)
      loadingPostsMessage.textContent =
        "Error: Page structure for posts is missing.";
    return;
  }

  try {
    const response = await fetch(`${Url}/posts/getPosts`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const posts = await response.json();
      console.log("Fetched posts:", posts);
      if (posts && posts.length > 0) {
        postsContainer.innerHTML = "";

        posts.forEach((post: { title: string; content: string }) => {
          const postCard = document.createElement("div");
          postCard.className =
            "bg-white shadow-md rounded-lg p-6 mb-6 hover:shadow-lg transition-shadow duration-300";

          const titleElement = document.createElement("h3");
          titleElement.className = "text-xl font-semibold text-violet-700 mb-2";
          titleElement.textContent = post.title;

          const contentElement = document.createElement("p");
          contentElement.className = "text-gray-700 mb-3";

          const snippetLength = 200;
          contentElement.textContent =
            post.content.length > snippetLength
              ? post.content.substring(0, snippetLength) + "..."
              : post.content;

          postCard.appendChild(titleElement);
          postCard.appendChild(contentElement);

          postsContainer.appendChild(postCard);
        });
      } else {
        postsContainer.innerHTML =
          '<p class="text-gray-600">You haven\'t created any blog posts yet. Why not write your first one?</p>';
      }
    } else {
      console.error("Failed to fetch posts, Status:", response.status);

      if (response.status === 401) {
        console.log("Unauthorized. Redirecting to login.");
        window.location.href = "/login.html";
        return;
      }
    }
  } catch (error) {
    console.error("Error fetching blog posts (network or other):", error);
  }
});
