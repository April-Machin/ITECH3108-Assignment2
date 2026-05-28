async function loadPosts() {

    const response = await fetch(
        "http://localhost:8000/api/posts"
    );

    const posts = await response.json();

    const postsDiv = document.getElementById("posts");

    postsDiv.innerHTML = "";

    posts.forEach(post => {

        postsDiv.innerHTML += `
            <div>
                <h2>${post.title}</h2>
                <p>${post.description}</p>
                <p>Posted by: ${post.username}</p>
                <p>Likes: ${post.likes}</p>
                <hr>
            </div>
        `;
    });
}
