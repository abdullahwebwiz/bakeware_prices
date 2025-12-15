let productData = [];
let slideIndex = 0;

// DOM Elements
const productTitleEl = document.getElementById("product-title");
const imageWrapperEl = document.querySelector(".image-wrapper"); // Get the wrapper for the loading class
const productImageEl = document.getElementById("product-image");
const productPriceEl = document.getElementById("product-price");
const notAvailableEl = document.getElementById("not-available");
const additionalNoteEl = document.getElementById("additional-note");
const slideIndexEl = document.getElementById("slide-index");
const statusMessageEl = document.getElementById("status-message");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const copyBtn = document.getElementById("copy-btn"); // New: Copy Button

const allInputs = [productPriceEl, notAvailableEl, additionalNoteEl];

/**
 * Fetches the product data from the local JSON file.
 */
async function fetchProductData() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    productData = data.map((item) => ({
      ...item,
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
      note: item.note !== undefined ? item.note : "",
    }));

    if (productData.length > 0) {
      showSlide(0);
    } else {
      productTitleEl.textContent = "No products found.";
    }
  } catch (error) {
    console.error("Could not fetch product data:", error);
    productTitleEl.textContent =
      "Error loading data. Check console (Failed to fetch).";
  }
}

/**
 * Displays the product data for the current slide index, handling the image loading state.
 * @param {number} n The index of the slide to display.
 */
function showSlide(n) {
  if (productData.length === 0) return;

  if (n >= productData.length) {
    slideIndex = 0;
  }
  if (n < 0) {
    slideIndex = productData.length - 1;
  }

  const product = productData[slideIndex];

  // 1. START LOADING STATE: Show spinner, hide old image
  imageWrapperEl.classList.add("loading");

  // 2. Update all non-image display elements
  productTitleEl.textContent = product.title;
  productPriceEl.value = product.price ?? "";
  notAvailableEl.checked = !product.isAvailable;
  additionalNoteEl.value = product.note;
  slideIndexEl.textContent = `Product ${slideIndex + 1} of ${
    productData.length
  }`;
  clearStatusMessage();

  // 3. Update Image Source and wait for load using a Promise

  const imageLoadPromise = new Promise((resolve, reject) => {
    // Clear previous listeners
    productImageEl.onload = null;
    productImageEl.onerror = null;

    // Listener for success
    productImageEl.onload = () => resolve();

    // Listener for failure
    productImageEl.onerror = () => reject(new Error("Image failed to load."));

    // Set the new source. This starts the loading process.
    productImageEl.src = product.image;
    productImageEl.alt = product.title;
  });

  imageLoadPromise
    .then(() => {
      // 4. END LOADING STATE: Hide spinner, show new image
      imageWrapperEl.classList.remove("loading");
      productImageEl.style.opacity = 1; // Ensure image is fully visible
    })
    .catch((error) => {
      console.error(error.message);
      // Fallback: Use a simple broken image SVG
      productImageEl.src =
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24"><path fill="gray" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 15.5l2.5 3.01L14.5 14l4.5 6H5l3.5-4.5z"/></svg>';
      imageWrapperEl.classList.remove("loading");
      productImageEl.style.opacity = 1;
      displayStatusMessage("Image failed to load!", 4000);
    });
}

/**
 * Reads the current form input values and updates the productData array (Auto-save).
 */
function updateProductData(showStatus = false) {
  if (productData.length === 0) return;

  const currentProduct = productData[slideIndex];

  const newPrice =
    productPriceEl.value === "" ? null : parseFloat(productPriceEl.value);
  const isNotAvailable = notAvailableEl.checked;
  const newNote = additionalNoteEl.value.trim();

  // Check for changes before updating
  const priceChanged =
    (currentProduct.price !== null ? currentProduct.price.toString() : "") !==
    (newPrice !== null ? newPrice.toString() : "");
  const availabilityChanged = currentProduct.isAvailable !== !isNotAvailable;
  const noteChanged = currentProduct.note !== newNote;

  if (priceChanged || availabilityChanged || noteChanged) {
    currentProduct.price = newPrice;
    currentProduct.isAvailable = !isNotAvailable;
    currentProduct.note = newNote;

    if (showStatus) {
      displayStatusMessage(`Data for "${currentProduct.title}" updated!`, 2000);
    }

    console.log(`Updated product ${currentProduct.id}:`, currentProduct);
  }
}

/**
 * Handles navigation to the previous or next slide.
 */
function navigateSlide(n) {
  updateProductData(false);
  slideIndex += n;
  showSlide(slideIndex);
}

// --- NEW FEATURE FUNCTIONS ---

/**
 * Formats the entire productData array into a human-readable text block for sharing.
 * @returns {string} The formatted text.
 */
function formatProductDataForSharing() {
  const formattedData = productData
    .map((product, index) => {
      // Use index + 1 for user-friendly numbering
      let line = `${index + 1}. ${product.title}`;

      if (product.isAvailable) {
        const price =
          product.price !== null ? `${product.price.toFixed(0)} PKR` : "N/A";
        line += `\n   - Price: ${price}`;
      } else {
        line += "\n   - Status: *Not Available*";
      }

      if (product.note) {
        line += `\n   - Note: ${product.note}`;
      }
      return line;
    })
    .join("\n---\n"); // Separator between products

  return "--- PRODUCT LIST ---\n\n" + formattedData + "\n\n--- END ---";
}

/**
 * Copies the formatted product data to the clipboard and shows an alert.
 */
async function copyDataToClipboard() {
  // Ensure the current product data is saved before copying the whole list
  updateProductData(false); 

  const dataToCopy = formatProductDataForSharing();

  try {
    await navigator.clipboard.writeText(dataToCopy);
    
    // Show status on the page
    displayStatusMessage("Product list copied to clipboard!", 3000);
    
    // Show a native browser alert as requested
    alert("Data copied to clipboard and ready to share on WhatsApp!");
  } catch (err) {
    console.error("Failed to copy data: ", err);
    displayStatusMessage("Error: Could not copy data to clipboard.", 4000);
    alert("Error: Could not copy data to clipboard.");
  }
}


// --- Status Message Functions ---

function displayStatusMessage(message, duration = 3000) {
  statusMessageEl.textContent = message;
  statusMessageEl.style.color = "#1a4d8c";
  setTimeout(clearStatusMessage, duration);
}

function clearStatusMessage() {
  statusMessageEl.textContent = "";
}

// --- Event Listeners ---

prevBtn.addEventListener("click", () => navigateSlide(-1));
nextBtn.addEventListener("click", () => navigateSlide(1));
copyBtn.addEventListener("click", copyDataToClipboard); // New: Listener for copy button

allInputs.forEach((input) => {
  input.addEventListener("input", () => {
    updateProductData(true);
  });
});

// --- Initialization ---

fetchProductData();