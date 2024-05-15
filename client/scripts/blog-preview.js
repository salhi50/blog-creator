$(function () {
  hljs.highlightAll();
  $("#body h2").each(function (i, h2) {
    $("#mobile-tcontent, #desktop-tcontent").append(`
        <li class="mb-1">
          <a href="#${h2.id}" class="link-secondary text-decoration-none">
            ${h2.textContent}
          </a>
        </li>`);
  });
});
