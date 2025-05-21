const Url = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  const postForm = document.querySelector("#post-form") as HTMLFormElement;
  const postTitle = document.querySelector("#post-title") as HTMLFormElement;
  const postContent = document.querySelector(
    "#post-content"
  ) as HTMLFormElement;
  const postAttachmentInput = document.getElementById(
    "post-attachment"
  ) as HTMLInputElement;
  const publishButton = document.querySelector(
    "#publish-button"
  ) as HTMLButtonElement;
  const saveDraftButton = document.querySelector(
    "#save-draft-button"
  ) as HTMLButtonElement;
  const createPostStatus = document.querySelector(
    "#create-post-status"
  ) as HTMLFormElement;

  const pageHeading = document.querySelector("h2");

  if (
    !postForm ||
    !postTitle ||
    !postContent ||
    !postAttachmentInput ||
    !publishButton ||
    !saveDraftButton ||
    !createPostStatus
  ) {
    console.error(
      "Error: One or more form elements are missing from the page."
    );
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const editPostId = urlParams.get("edit");
  let currentAttachmentPath: string | null = null;

  if (editPostId) {
    document.title = "Edit Post";
    if (pageHeading) pageHeading.textContent = "Edit Post";

    try {
      const response = await fetch(`${Url}/posts/${editPostId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const post = await response.json();

        postTitle.value = post.title;
        postContent.value = post.content;
        currentAttachmentPath = post.attachmentPath;

        if (currentAttachmentPath) {
          const attachmentInfo = document.createElement("p");
          attachmentInfo.className = "text-sm text-gray-600 mt-1";
          const fileName =
            currentAttachmentPath.split("/").pop() || currentAttachmentPath;
          attachmentInfo.textContent = `Current attachment: ${fileName}`;
          postAttachmentInput.parentNode?.insertBefore(
            attachmentInfo,
            postAttachmentInput.nextSibling
          );
        }
      } else {
        createPostStatus.textContent =
          "Failed to load post data. Please try again.";
        createPostStatus.className =
          "mt-4 text-sm h-5 text-red-500 font-medium";
      }
    } catch (error) {
      console.error("Error fetching post data:", error);
      createPostStatus.textContent =
        "Error loading post data. Please try again.";
      createPostStatus.className = "mt-4 text-sm h-5 text-red-500 font-medium";
    }
  }

  postForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitter = event.submitter as HTMLButtonElement;
    const action = submitter?.value;

    if (!action) {
      console.error("Could not determine submit action (draft or publish).");
      createPostStatus.textContent = "Action unclear. Please try again.";
      return;
    }

    const isPublished = action === "publish";

    const title = postTitle.value.trim();
    const content = postContent.value.trim();
    const attachmentFile = postAttachmentInput.files
      ? postAttachmentInput.files[0]
      : null;

    if (!title || !content) {
      console.log("Post's title or content is empty.");
      createPostStatus.textContent =
        "Title and content fields cannot be empty.";
      return;
    }

    if (title.length < 3 || content.length < 10) {
      console.log(
        "Post's title cannot be less than 3 characters and content cannot be less than 10 charaacters."
      );
      createPostStatus.textContent =
        "Title (min 3 chars) and Content (min 10 chars) are required.";
      return;
    }

    if (attachmentFile && attachmentFile.size > 2 * 1024 * 1024) {
      if (createPostStatus)
        createPostStatus.textContent = "File is too large. Max 5MB allowed.";
      postAttachmentInput.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("isPublished", String(isPublished));
    if (attachmentFile) {
      formData.append("attachment", attachmentFile, attachmentFile.name);
    } else if (currentAttachmentPath && editPostId) {
      formData.append("attachmentPath", currentAttachmentPath);
    }

    try {
      let url = `${Url}/posts/create`;
      let method = "POST";

      if (editPostId) {
        url = `${Url}/posts/${editPostId}`;
        method = "PUT";
      }

      if (method === "PUT") {
        const postData = {
          title,
          content,
          isPublished,
          attachmentPath: currentAttachmentPath,
        };

        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Post update successful:", result);
          createPostStatus.textContent =
            result.message || `Post ${isPublished ? "published" : "saved"}!`;
          createPostStatus.className =
            "mt-4 text-sm h-5 text-gray-600 font-medium";

          setTimeout(() => {
            window.location.href = "./dashboard.html";
          }, 1000);
        } else {
          const errorData = await response.json();
          console.error("Server error response:", errorData);
          createPostStatus.textContent =
            errorData.message || "Failed to update post.";
          createPostStatus.className =
            "mt-4 text-sm h-5 text-red-500 font-medium";
        }
      } else {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content);
        formData.append("isPublished", String(isPublished));
        if (attachmentFile) {
          formData.append("attachment", attachmentFile, attachmentFile.name);
        }

        const response = await fetch(url, {
          method: method,
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Post creation successful:", result);
          createPostStatus.textContent =
            result.message || `Post ${isPublished ? "published" : "saved"}!`;
          createPostStatus.className =
            "mt-4 text-sm h-5 text-gray-600 font-medium";

          setTimeout(() => {
            window.location.href = "./dashboard.html";
          }, 1000);
        } else {
          const errorData = await response.json();
          console.error("Server error response:", errorData);
          createPostStatus.textContent =
            errorData.message || "Failed to create post.";
          createPostStatus.className =
            "mt-4 text-sm h-5 text-red-500 font-medium";
        }
      }
    } catch (error) {
      console.error(
        `Error during post ${editPostId ? "update" : "creation"}:`,
        error
      );
      createPostStatus.textContent = `Error ${
        editPostId ? "updating" : "creating"
      } post. Please try again.`;
      createPostStatus.className = "mt-4 text-sm h-5 text-red-500 font-medium";
    }
  });
});
