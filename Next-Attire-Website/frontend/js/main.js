/* ==========================================================
   NEXT ATTIRE — front-end behaviour
   No build step needed: plain JS, loaded as a <script> tag.
   ========================================================== */
(function () {
  "use strict";

  /* ---------- Mobile nav ---------- */
  var burger = document.getElementById("burgerBtn");
  var links = document.getElementById("navLinks");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReduced) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("in");
    });
  }

  /* ---------- Animated stat counters ---------- */
  var counters = document.querySelectorAll(".num[data-count]");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (prefersReduced) {
      el.textContent = target + "+";
      return;
    }
    var dur = 1200;
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var val = Math.floor(target * (1 - Math.pow(1 - p, 3)));
      el.textContent = val + "+";
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var io2 = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            animateCount(e.target);
            io2.unobserve(e.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) {
      io2.observe(el);
    });
  } else {
    counters.forEach(function (el) {
      el.textContent = el.getAttribute("data-count") + "+";
    });
  }

  /* ---------- Enquiry form -> backend API ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var msgEl = document.getElementById("enquiryMsg");
    var submitBtn = document.getElementById("enquirySubmit");

    // Same-origin by default. If the API is hosted elsewhere, set:
    // window.NEXT_ATTIRE_API_BASE = "https://api.yourdomain.com";
    var API_BASE = window.NEXT_ATTIRE_API_BASE || "";

    form.addEventListener("submit", function (evt) {
      evt.preventDefault();
      msgEl.textContent = "";
      msgEl.className = "form-msg";

      var data = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        message: form.message.value.trim()
      };

      if (!data.name || !data.phone || !data.email || !data.message) {
        msgEl.textContent = "Please fill in every field.";
        msgEl.className = "form-msg err";
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      fetch(API_BASE + "/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          return res.json().then(function (body) {
            return { ok: res.ok, body: body };
          });
        })
        .then(function (result) {
          if (result.ok) {
            msgEl.textContent = "Thanks — we'll be in touch shortly.";
            msgEl.className = "form-msg ok";
            form.reset();
          } else {
            msgEl.textContent = (result.body && result.body.error) || "Something went wrong. Please try again.";
            msgEl.className = "form-msg err";
          }
        })
        .catch(function () {
          msgEl.textContent = "Could not reach the server. Please try again in a moment.";
          msgEl.className = "form-msg err";
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit Enquiry";
        });
    });
  }
})();
