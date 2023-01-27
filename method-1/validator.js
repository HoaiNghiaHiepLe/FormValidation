function validator(options) {
  function getParent(element, selector) {
    while (element.parentElement) {
      if (element.parentElement.matches(selector)) {
        return element.parentElement;
      }
      element = element.parentElement;
    }
  }
  const selectorRule = {};
  function validate(inputElement, rule) {
    const errorElement = getParent(
      inputElement,
      options.formGroupSelector
    ).querySelector(options.errorSelector);
    var errorMessage;
    // lấy ra các rule từ object selectorRule bằng biến truyền vào là rule.selector
    const rules = selectorRule[rule.selector];
    // lặp qua từng rule và kiểm tra
    // nếu có lỗi thì dừng việc kiểm tra
    for (var i = 0; i < rules.length; ++i) {
      switch (inputElement.type) {
        case "radio":
        case "checkbox":
          errorMessage = rules[i](
            formElement.querySelector(rule.selector + ":checked")
          );
          break;
        default:
          errorMessage = rules[i](inputElement.value);
      }

      if (errorMessage) break;
    }

    if (errorMessage) {
      errorElement.innerText = errorMessage;
      getParent(inputElement, options.formGroupSelector).classList.add(
        "invalid"
      );
    } else {
      errorElement.innerText = "";
      getParent(inputElement, options.formGroupSelector).classList.remove(
        "invalid"
      );
    }
    return !errorMessage;
  }

  // get form need to validate in DOM
  var formElement = document.querySelector(options.form);

  if (formElement) {
    formElement.onsubmit = (e) => {
      e.preventDefault();
      let isFormValid = true;
      // iterates each rule and validates
      options.rules.forEach((rule) => {
        const inputElement = formElement.querySelector(rule.selector);
        var isValid = validate(inputElement, rule);
        if (!isValid) {
          isFormValid = false;
        }
      });

      if (isFormValid) {
        // submit with JS
        if (typeof options.onSubmit === "function") {
          const enableInputs = formElement.querySelectorAll(
            "[name]:not([disabled])"
          );
          const formValues = Array.from(enableInputs).reduce(
            (values, input) => {
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
            },
            {}
          );
          options.onSubmit(formValues);
        }
        // default submit
        else {
          formElement.submit();
        }
      }
    };
    // iterates all rule in rules array and handle them
    options.rules.forEach((rule) => {
      // store rules in each input
      if (Array.isArray(selectorRule[rule.selector])) {
        selectorRule[rule.selector].push(rule.test);
      } else {
        selectorRule[rule.selector] = [rule.test];
      }
      // select input from form selector argument passed through validator function inside rules array
      const inputElements = formElement.querySelectorAll(rule.selector);
      Array.from(inputElements).forEach((inputElement) => {
        // handle validate on blur
        inputElement.onblur = () => {
          validate(inputElement, rule);
        };
        // handle onchange
        inputElement.onchange = () => {
          validate(inputElement, rule);
        };
        // handle validate on input
        inputElement.oninput = () => {
          getParent(inputElement, options.formGroupSelector).querySelector(
            options.errorSelector
          ).innerText = "";
          getParent(inputElement, options.formGroupSelector).classList.remove(
            "invalid"
          );
        };
      });
    });
  }
}

// define rules
// nguyên tắc của các rules:
// 1. khi có lỗi => trả ra message lỗi
// 2. Khi hợp lệ => k trả ra gì cả (undefined)
validator.isRequired = function (selector, message) {
  return {
    selector: selector,
    test(value) {
      if (typeof value === "string") {
        return value.trim() ? undefined : "Vui lòng nhập trường này";
      } else {
        return value ? undefined : "Vui lòng nhập trường này";
      }
    },
  };
};
validator.isEmail = function (selector, message) {
  return {
    selector: selector,
    test(value) {
      const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      return regex.test(value) ? undefined : "Vui lòng nhập đúng email";
    },
  };
};
validator.minLength = function (selector, min, message) {
  return {
    selector: selector,
    test(value) {
      return value.length >= min
        ? undefined
        : `Vui lòng nhập tối thiểu ${min} ký tự`;
    },
  };
};
validator.isConfirmed = function (selector, getConfirmValue, message) {
  return {
    selector: selector,
    test(value) {
      return value === getConfirmValue()
        ? undefined
        : message || `mật khẩu không trùng khớp`;
    },
  };
};
