(function () {
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  function setupPasswordToggle(control) {
    var toggle = control.querySelector("[data-password-toggle]");
    var input = control.querySelector("[data-password-input]");
    if (!toggle || !input) return;

    var icon = toggle.querySelector("img");
    if (!icon) return;

    var openSrc = toggle.getAttribute("data-icon-open");
    var closedSrc = toggle.getAttribute("data-icon-closed");

    toggle.addEventListener("click", function () {
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      icon.src = show ? openSrc : closedSrc;
      icon.alt = show ? "Hide password" : "Show password";
    });
  }

  function clearFieldError(field) {
    field.classList.remove("perry-field--error");
    var error = field.querySelector("[data-field-error]");
    if (error) {
      error.hidden = true;
      error.textContent = "";
    }
  }

  function showFieldError(field, message) {
    field.classList.add("perry-field--error");
    var error = field.querySelector("[data-field-error]");
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
  }

  function isStrongPassword(value) {
    return passwordPattern.test(value);
  }

  function setupFormValidation(form) {
    var fields = form.querySelectorAll("[data-field]");

    fields.forEach(function (field) {
      var input = field.querySelector("[data-required-input]");
      if (!input) return;
      input.addEventListener("input", function () {
        clearFieldError(field);
      });
    });

    form.addEventListener("submit", function (event) {
      var valid = true;
      var source = form.querySelector("[data-confirm-source]");
      var target = form.querySelector("[data-confirm-target]");

      fields.forEach(function (field) {
        var input = field.querySelector("[data-required-input]");
        if (!input) return;

        clearFieldError(field);
        var value = input.value.trim();

        if (input.hasAttribute("data-email-input")) {
          if (!value || !emailPattern.test(value)) {
            valid = false;
            showFieldError(
              field,
              input.getAttribute("data-error-empty") || "Wrong or invalid email adress"
            );
          }
          return;
        }

        if (input.hasAttribute("data-password-rules")) {
          if (!value || !isStrongPassword(value)) {
            valid = false;
            showFieldError(
              field,
              input.getAttribute("data-error-empty") ||
                "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, and be at least 8 characters long"
            );
          }
          return;
        }

        if (input.hasAttribute("data-confirm-target")) {
          // handled after loop together with source
          return;
        }

        if (!value) {
          valid = false;
          showFieldError(
            field,
            input.getAttribute("data-error-empty") || "This field is required"
          );
        }
      });

      if (target) {
        var confirmField = target.closest("[data-field]");
        var passwordValue = source ? source.value : "";
        var confirmValue = target.value;
        if (
          !confirmValue.trim() ||
          passwordValue !== confirmValue
        ) {
          valid = false;
          if (confirmField) {
            showFieldError(
              confirmField,
              target.getAttribute("data-error-mismatch") || "Passwords must match"
            );
          }
        }
      }

      if (!valid) {
        event.preventDefault();
      }
    });
  }

  document.querySelectorAll("[data-auth-form]").forEach(function (form) {
    form.querySelectorAll(".perry-field__control").forEach(setupPasswordToggle);
    setupFormValidation(form);
  });
})();
