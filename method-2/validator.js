function Validator(formSelector) {
  var formRules = {};
  function getParent(element, selector) {
    while (element.parentElement) {
      if (element.parentElement.matches(selector)) {
        return element.parentElement;
      }
      element = element.parentElement;
    }
  }

  var ValidatorRules = {
    required: function (value) {
      return value ? undefined : "vui lòng nhập trường này";
    },
    email: function (value) {
      var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      return regex.test(value) ? undefined : "vui lòng nhập đúng email";
    },
    min: function (min) {
      return function (value) {
        return value.length >= min
          ? undefined
          : `vui lòng nhập ít nhất ${min} ký tự`;
      };
    },
  };

  formElement = document.querySelector(formSelector);
  if (formElement) {
    var inputs = formElement.querySelectorAll("[name][rule]");
    for (var input of inputs) {
      var rules = input.getAttribute("rule").split("|");
      for (var rule of rules) {
        var isRuleHasValue = rule.includes(":");

        if (isRuleHasValue) {
          var ruleInfo = rule.split(":");
          rule = ruleInfo[0];
        }

        var ruleFunc = ValidatorRules[rule];

        if (isRuleHasValue) {
          ruleFunc = ruleFunc(ruleInfo[1]);
        }

        if (Array.isArray(formRules[input.name])) {
          formRules[input.name].push(ruleFunc);
        } else {
          formRules[input.name] = [ruleFunc];
        }
      }
      // event listeners
      input.onblur = handleValidate;
      input.oninput = handleClearError;
    }
    // handle validation
    function handleValidate(e) {
      var rules = formRules[e.target.name];
      var errorMessage;
      // for (var rule of rules) {
      //   errorMessage = rule(e.target.value);
      //   if (errorMessage) break;
      // }
      rules.some(function (rule) {
        errorMessage = rule(e.target.value);
        return errorMessage;
      });
      // if has errorMessage, displays it in form-message element
      if (errorMessage) {
        var formGroup = getParent(e.target, ".form-group");
        if (formGroup) {
          formGroup.classList.add("invalid");
          var formMessage = formGroup.querySelector(".form-message");
          if (formMessage) {
            formMessage.innerText = errorMessage;
          }
        }
      }
      return !errorMessage;
    }

    // handle clear error messages
    function handleClearError(e) {
      var formGroup = getParent(e.target, ".form-group");
      if (formGroup.classList.contains("invalid")) {
        formGroup.classList.remove("invalid");
        var formMessage = formGroup.querySelector(".form-message");

        if (formMessage) {
          formMessage.innerText = "";
        }
      }
    }
  }

  // handle form submit
  formElement.onsubmit = (e) => {
    e.preventDefault();
    var inputs = formElement.querySelectorAll("[name][rule]");
    var isValid = true;
    for (var input of inputs) {
      handleValidate({ target: input });
      if (!handleValidate({ target: input })) {
        isValid = false;
      }
    }
    if (isValid) {
      if (typeof this.onSubmit === "function") {
        const enableInputs = formElement.querySelectorAll(
          "[name]:not([disabled])"
        );
        const formValues = Array.from(enableInputs).reduce((values, input) => {
          switch (input.type) {
            case "radio":
              values[input.name] = formElement.querySelector(
                `input[name='${input.name}']:checked`
              ).value;
              break;
            case "checkbox":
              if (!input.matches(":checked")) {
                values[input.name] = [];
                return values;
              }
              if (!Array.isArray(values[input.name])) {
                values[input.name] = [];
              }
              values[input.name].push(input.value);
              break;
            case "file":
              values[input.name] = input.files;
              break;
            default:
              values[input.name] = input.value;
          }
          return values;
        }, {});
        this.onSubmit(formValues);
      } else {
        formElement.submit();
      }
    }
  };
}
