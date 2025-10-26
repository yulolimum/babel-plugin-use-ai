function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
function isPalindrome(str) {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}
function mergeAndSort(arr1, arr2) {
  return [...arr1, ...arr2].sort((a, b) => a - b);
}
function calculateFactorial(n) {
  if (n < 0) {
    throw new Error('Factorial is not defined for negative numbers');
  }
  if (n === 0 || n === 1) {
    return 1;
  }
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}
function formatCurrency(amount, currency) {
  switch (currency) {
    case 'USD':
      return `$${amount.toFixed(2)}`;
    case 'EUR':
      return `€${amount.toFixed(2)}`;
    case 'GBP':
      return `£${amount.toFixed(2)}`;
    default:
      throw new Error('Unsupported currency');
  }
}
function handleFormSubmit(event) {
  event.preventDefault();
  setIsLoading(true);
  setError(null);
  setTimeout(() => {
    try {
      setIsLoading(false);
      setSuccess(true);
    } catch (error) {
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  }, 2000);
}
function ParentComponent() {
  function nestedFunction() {
    return "Hello from nested function!";
  }
  return nestedFunction();
}
const reverseString = function (str) {
  return str.split('').reverse().join('');
};
const capitalizeWords = str => {
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};
const removeDuplicates = arr => {
  return Array.from(new Set(arr));
};
const debounce = (fn, delay) => {
  let timeoutId = null;
  return function (...args) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
};

// Object Method examples
const stringUtils = {
  countVowels(str) {
    let count = 0;
    const vowels = 'aeiouAEIOU';
    for (let i = 0; i < str.length; i++) {
      if (vowels.includes(str[i])) {
        count++;
      }
    }
    return count;
  },
  removeWhitespace(str) {
    return str.replace(/\s/g, '');
  },
  truncate(str, maxLength) {
    if (str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength - 3) + '...';
  }
};
const mathUtils = {
  isPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  },
  fibonacci(n) {
    if (n <= 0) return 0;
    if (n === 1) return 1;
    let prev = 0;
    let curr = 1;
    for (let i = 2; i <= n; i++) {
      const next = prev + curr;
      prev = curr;
      curr = next;
    }
    return curr;
  }
};
function ParentComponent2() {
  function getHelloWorld() {
    return 'Hello World';
  }
  function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
  return getHelloWorld() + ' - ' + getCurrentTime();
}