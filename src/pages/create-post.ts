const Url = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
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
  ) as HTMLFormElement;
  const saveDraftButton = document.querySelector(
    "#save-draft-button"
  ) as HTMLFormElement;
  const createPostStatus = document.querySelector(
    "#create-post-status"
  ) as HTMLFormElement;

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
        createPostStatus.textContent = "File is too large. Max 2MB allowed.";
      postAttachmentInput.value = "";
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("isPublished", String(isPublished));
    if (attachmentFile) {
      formData.append("attachment", attachmentFile, attachmentFile.name);
    }

    try {
      const response = await fetch(`${Url}/posts/create`, {
        method: "POST",
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
        let errorMessage = `Failed to ${
          isPublished ? "publish" : "save draft"
        }.`;
        createPostStatus.textContent = errorMessage;
        createPostStatus.className =
          "mt-4 text-sm h-5 text-red-500 font-medium";
      }
    } catch (error) {
      console.error("Error during post creation:", error);
    }
  });
});
