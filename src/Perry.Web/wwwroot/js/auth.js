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
          if (!value) {
            valid = false;
            showFieldError(
              field,
              input.getAttribute("data-error-empty") ||
                "This field is necessary to continue!"
            );
            return;
          }
          if (!isStrongPassword(value)) {
            valid = false;
            showFieldError(
              field,
              "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, and be at least 8 characters long"
            );
          }
          return;
        }

        if (input.hasAttribute("data-confirm-target")) {
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
        if (!confirmValue.trim()) {
          valid = false;
          if (confirmField) {
            showFieldError(
              confirmField,
              target.getAttribute("data-error-empty") || "This field is necessary to continue!"
            );
          }
        } else if (passwordValue !== confirmValue) {
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

  function setupCodeInputs(container) {
    var form = container.closest("form");
    var inputs = Array.from(container.querySelectorAll("[data-code-digit]"));
    var hidden = (form && form.querySelector("[data-code-hidden]")) || document.querySelector("[data-code-hidden]");
    if (!inputs.length) return;

    function updateHidden() {
      if (!hidden) return;
      hidden.value = inputs.map(function (i) { return (i.value || "").replace(/\D/g, ""); }).join("");
    }

    inputs.forEach(function (input, index) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Backspace" && !input.value && index > 0) {
          inputs[index - 1].focus();
        }
        if (e.key === "ArrowLeft" && index > 0) {
          inputs[index - 1].focus();
        }
        if (e.key === "ArrowRight" && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });

      input.addEventListener("input", function () {
        var val = input.value.replace(/\D/g, "");
        // Автозаполнение OTP может вставить все 6 цифр в первое поле
        if (val.length > 1) {
          val.split("").slice(0, inputs.length).forEach(function (ch, i) {
            if (inputs[i]) inputs[i].value = ch;
          });
          updateHidden();
          container.classList.remove("code-inputs--error");
          var focusIndex = Math.min(val.length, inputs.length) - 1;
          if (focusIndex >= 0) inputs[focusIndex].focus();
          return;
        }
        input.value = val;
        updateHidden();
        container.classList.remove("code-inputs--error");

        if (val && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });

      input.addEventListener("paste", function (e) {
        e.preventDefault();
        var data = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, inputs.length);
        data.split("").forEach(function (ch, i) {
          if (inputs[i]) inputs[i].value = ch;
        });
        updateHidden();
        var focusIndex = Math.min(data.length, inputs.length - 1);
        inputs[focusIndex].focus();
      });
    });

    if (form) {
      form.addEventListener("submit", function (e) {
        updateHidden();
        if (!hidden || hidden.value.length !== inputs.length) {
          e.preventDefault();
          container.classList.add("code-inputs--error");
        }
      });
    }
  }

  document.querySelectorAll("[data-auth-form]").forEach(function (form) {
    form.querySelectorAll(".perry-field__control").forEach(setupPasswordToggle);
    setupFormValidation(form);
  });

  document.querySelectorAll("[data-code-inputs]").forEach(setupCodeInputs);

  document.querySelectorAll("[data-resend-wrap]").forEach(function (wrap) {
    var btn = wrap.querySelector("[data-resend-btn]");
    var timerEl = wrap.querySelector("[data-resend-timer]");
    var seconds = parseInt(wrap.getAttribute("data-resend-seconds") || "60", 10);
    if (!btn || !timerEl) return;

    function tick() {
      if (seconds <= 0) {
        timerEl.hidden = true;
        btn.disabled = false;
        return;
      }
      var m = Math.floor(seconds / 60);
      var s = seconds % 60;
      timerEl.textContent = "Resend code " + m + ":" + String(s).padStart(2, "0");
      timerEl.hidden = false;
      btn.disabled = true;
      seconds -= 1;
      setTimeout(tick, 1000);
    }

    tick();
  });
})();
