import { auth, db } from "./firebase.js";
import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Custom Dropdown Class
class CustomDropdown {
  constructor(selectElement, options = {}) {
    this.select = selectElement;
    this.options = options;
    this.selectedValue = selectElement.value;
    this.init();
  }

  init() {
    // Hide original select
    this.select.style.display = 'none';

    // Create wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'custom-dropdown';

    // Create selected display
    this.selected = document.createElement('div');
    this.selected.className = 'dropdown-selected';

    // Get selected option text
    const selectedOption = this.select.options[this.select.selectedIndex];
    const icon = selectedOption?.dataset.icon || 'fa-circle';

    this.selected.innerHTML = `
      <i class="fas ${icon}"></i>
      <span>${selectedOption?.text || 'Select...'}</span>
      <i class="fas fa-chevron-down"></i>
    `;

    // Create options container
    this.optionsContainer = document.createElement('div');
    this.optionsContainer.className = 'dropdown-options';

    // Add options
    Array.from(this.select.options).forEach(option => {
      const optionDiv = document.createElement('div');
      optionDiv.className = `dropdown-option ${option.value === this.selectedValue ? 'selected' : ''}`;
      optionDiv.dataset.value = option.value;
      optionDiv.dataset.icon = option.dataset.icon || 'fa-circle';
      optionDiv.innerHTML = `
        <i class="fas ${option.dataset.icon || 'fa-circle'}"></i>
        <span>${option.text}</span>
      `;

      optionDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        this.select.value = option.value;
        this.selectedValue = option.value;

        // Update selected display
        this.selected.innerHTML = `
          <i class="fas ${option.dataset.icon || 'fa-circle'}"></i>
          <span>${option.text}</span>
          <i class="fas fa-chevron-down"></i>
        `;

        // Update selected class
        document.querySelectorAll('.dropdown-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        optionDiv.classList.add('selected');

        // Close dropdown
        this.optionsContainer.classList.remove('show');
        this.selected.classList.remove('active');

        // Trigger change event
        if (this.options.onChange) {
          this.options.onChange(option.value, option.text);
        }

        // Dispatch change event on original select
        const event = new Event('change', { bubbles: true });
        this.select.dispatchEvent(event);
      });

      this.optionsContainer.appendChild(optionDiv);
    });

    // Toggle dropdown on click
    this.selected.addEventListener('click', (e) => {
      e.stopPropagation();
      this.optionsContainer.classList.toggle('show');
      this.selected.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.wrapper.contains(e.target)) {
        this.optionsContainer.classList.remove('show');
        this.selected.classList.remove('active');
      }
    });

    // Assemble
    this.wrapper.appendChild(this.selected);
    this.wrapper.appendChild(this.optionsContainer);

    // Insert after select
    this.select.parentNode.insertBefore(this.wrapper, this.select.nextSibling);
  }

  updateOptions(options) {
    this.optionsContainer.innerHTML = '';
    options.forEach(option => {
      const optionDiv = document.createElement('div');
      optionDiv.className = `dropdown-option ${option.value === this.selectedValue ? 'selected' : ''}`;
      optionDiv.dataset.value = option.value;
      optionDiv.innerHTML = `
        <i class="fas ${option.icon || 'fa-circle'}"></i>
        <span>${option.text}</span>
      `;

      optionDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        this.select.value = option.value;
        this.selectedValue = option.value;

        this.selected.innerHTML = `
          <i class="fas ${option.icon || 'fa-circle'}"></i>
          <span>${option.text}</span>
          <i class="fas fa-chevron-down"></i>
        `;

        document.querySelectorAll('.dropdown-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        optionDiv.classList.add('selected');

        this.optionsContainer.classList.remove('show');
        this.selected.classList.remove('active');

        if (this.options.onChange) {
          this.options.onChange(option.value, option.text);
        }

        const event = new Event('change', { bubbles: true });
        this.select.dispatchEvent(event);
      });

      this.optionsContainer.appendChild(optionDiv);
    });
  }

  // Method to set value programmatically
  setValue(value) {
    const option = Array.from(this.select.options).find(opt => opt.value === value);
    if (option) {
      this.select.value = value;
      this.selectedValue = value;

      this.selected.innerHTML = `
        <i class="fas ${option.dataset.icon || 'fa-circle'}"></i>
        <span>${option.text}</span>
        <i class="fas fa-chevron-down"></i>
      `;

      // Update selected class in dropdown options
      const optionDivs = this.optionsContainer.querySelectorAll('.dropdown-option');
      optionDivs.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.value === value) {
          opt.classList.add('selected');
        }
      });
    }
  }
}

// Custom Popup System
class Popup {
  static show(options) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'custom-popup-overlay';

      let icon = 'fa-info-circle';
      if (options.type === 'success') icon = 'fa-check-circle';
      if (options.type === 'error') icon = 'fa-exclamation-circle';
      if (options.type === 'warning') icon = 'fa-exclamation-triangle';

      const popup = document.createElement('div');
      popup.className = 'custom-popup';

      let inputHtml = '';
      if (options.input) {
        inputHtml = `<input type="${options.inputType || 'text'}" class="popup-input" placeholder="${options.placeholder || 'Enter value'}" />`;
      }

      popup.innerHTML = `
        <h3><i class="fas ${icon}"></i> ${options.title || 'Message'}</h3>
        <p>${options.message || ''}</p>
        ${inputHtml}
        <div class="popup-buttons">
          <button class="popup-cancel"><i class="fas fa-times"></i> Cancel</button>
          <button class="popup-confirm"><i class="fas fa-check"></i> ${options.confirmText || 'OK'}</button>
        </div>
      `;

      overlay.appendChild(popup);
      document.body.appendChild(overlay);

      const confirmBtn = popup.querySelector('.popup-confirm');
      const cancelBtn = popup.querySelector('.popup-cancel');
      const input = popup.querySelector('.popup-input');

      const close = (result) => {
        document.body.removeChild(overlay);
        resolve(result);
      };

      confirmBtn.onclick = () => {
        if (input) {
          close(input.value);
        } else {
          close(true);
        }
      };

      cancelBtn.onclick = () => close(false);

      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          close(false);
        }
      });
    });
  }

  static alert(message, title = 'Alert', type = 'info') {
    return this.show({ title, message, confirmText: 'OK', type });
  }

  static confirm(message, title = 'Confirm') {
    return this.show({ title, message, confirmText: 'Yes', type: 'warning' });
  }

  static prompt(message, title = 'Enter Value', placeholder = 'Enter amount') {
    return this.show({ title, message, confirmText: 'Submit', input: true, inputType: 'number', placeholder });
  }

  static success(message) {
    return this.alert(message, 'Success', 'success');
  }

  static error(message) {
    return this.alert(message, 'Error', 'error');
  }
}

// Loading Skeleton
function showSkeleton() {
  const container = document.getElementById("clientsContainer");
  container.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'card skeleton-card';
    skeleton.innerHTML = `
      <div class="skeleton-text skeleton"></div>
      <div class="skeleton-text skeleton"></div>
      <div class="skeleton-text skeleton"></div>
    `;
    container.appendChild(skeleton);
  }
}

let currentUser;
let statusDropdown, paymentDropdown, projectStatusDropdown;
let editingProjectId = null; // Track if we're editing a project

const userName = document.getElementById("userName");
const userPhoto = document.getElementById("userPhoto");
const logoutBtn = document.getElementById("logoutBtn");

const addClientBtn = document.getElementById("addClientBtn");
const clientPanel = document.getElementById("clientPanel");
const closePanel = document.getElementById("closePanel");
const saveClient = document.getElementById("saveClient");

const addProjectBtn = document.getElementById("addProjectBtn");
const projectPanel = document.getElementById("projectPanel");
const closeProjectPanel = document.getElementById("closeProjectPanel");
const saveProject = document.getElementById("saveProject");
const projectClient = document.getElementById("projectClient");

const clientsContainer = document.getElementById("clientsContainer");

const totalClients = document.getElementById("totalClients");
const totalProjects = document.getElementById("totalProjects");
const totalEarnings = document.getElementById("totalEarnings");
const pendingPayments = document.getElementById("pendingPayments");

// Initialize custom dropdowns
function initDropdowns() {
  // Status filter dropdown
  const statusSelect = document.getElementById("statusFilter");
  statusDropdown = new CustomDropdown(statusSelect, {
    onChange: (value) => {
      showSkeleton();
      loadAllData();
    }
  });

  // Payment filter dropdown
  const paymentSelect = document.getElementById("paymentFilter");
  paymentDropdown = new CustomDropdown(paymentSelect, {
    onChange: (value) => {
      showSkeleton();
      loadAllData();
    }
  });

  // Project status dropdown (in panel)
  const projectStatusSelect = document.getElementById("projectStatus");
  projectStatusDropdown = new CustomDropdown(projectStatusSelect);
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
  window.location.replace("../index.html");
}
 else {
    currentUser = user;
    userName.textContent = user.displayName;
    userPhoto.src = user.photoURL;
    initDropdowns();
    showSkeleton();
    loadAllData();
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../index.html";
});

addClientBtn.onclick = () => {
  clientPanel.classList.add("active");
  // Clear form
  document.getElementById("clientName").value = '';
  document.getElementById("clientPhone").value = '';
  document.getElementById("clientEmail").value = '';
  document.getElementById("clientNotes").value = '';
};

closePanel.onclick = () => clientPanel.classList.remove("active");

addProjectBtn.onclick = async () => {
  // Reset editing mode
  editingProjectId = null;

  projectPanel.classList.add("active");
  await loadClientOptions();

  // Clear form
  document.getElementById("projectTitle").value = '';
  document.getElementById("projectTotal").value = '';
  document.getElementById("projectAdvance").value = '';
  document.getElementById("projectDeadline").value = '';

  // Reset project status dropdown
  const statusSelect = document.getElementById("projectStatus");
  statusSelect.value = 'Pending';
  if (projectStatusDropdown) {
    projectStatusDropdown.setValue('Pending');
  }
};

closeProjectPanel.onclick = () => {
  projectPanel.classList.remove("active");
  editingProjectId = null; // Reset editing mode
};

/* ---------------- SAVE CLIENT ---------------- */

saveClient.onclick = async () => {
  const name = document.getElementById("clientName").value;
  const phone = document.getElementById("clientPhone").value;
  const email = document.getElementById("clientEmail").value;
  const notes = document.getElementById("clientNotes").value;

  if (!name) {
    await Popup.error("Client name is required");
    return;
  }

  try {
    await addDoc(collection(db, "clients"), {
      name,
      phone,
      email,
      notes,
      userId: currentUser.uid,
      createdAt: new Date()
    });

    clientPanel.classList.remove("active");
    await Popup.success("Client added successfully!");
    loadAllData();
  } catch (error) {
    await Popup.error("Error adding client: " + error.message);
  }
};

/* ---------------- SAVE PROJECT (ADD OR UPDATE) ---------------- */

saveProject.onclick = async () => {
  const clientId = projectClient.value;
  const clientName = projectClient.options[projectClient.selectedIndex]?.text || '';
  const title = document.getElementById("projectTitle").value;
  const total = Number(document.getElementById("projectTotal").value);
  const advance = Number(document.getElementById("projectAdvance").value) || 0;
  const deadline = document.getElementById("projectDeadline").value;
  const status = document.getElementById("projectStatus").value;

  if (!title || !total) {
    await Popup.error("Project title and total price are required");
    return;
  }

  if (!clientId) {
    await Popup.error("Please select a client");
    return;
  }

  try {
    const projectData = {
      clientId,
      clientName,
      title,
      totalPrice: total,
      advance: advance,
      remaining: total - advance,
      deadline,
      status,
      userId: currentUser.uid
    };

    if (editingProjectId) {
      // Update existing project
      await updateDoc(doc(db, "projects", editingProjectId), projectData);
      await Popup.success("Project updated successfully!");
    } else {
      // Add new project
      projectData.createdAt = new Date();
      await addDoc(collection(db, "projects"), projectData);
      await Popup.success("Project added successfully!");
    }

    projectPanel.classList.remove("active");
    editingProjectId = null; // Reset editing mode
    loadAllData();
  } catch (error) {
    await Popup.error("Error saving project: " + error.message);
  }
};

/* ---------------- LOAD DATA ---------------- */

async function loadAllData() {
  clientsContainer.innerHTML = "";

  const searchValue = document.getElementById("searchInput").value.toLowerCase();
  const statusValue = document.getElementById("statusFilter").value;
  const paymentValue = document.getElementById("paymentFilter").value;

  const clientQuery = query(
    collection(db, "clients"),
    where("userId", "==", currentUser.uid)
  );

  const projectQuery = query(
    collection(db, "projects"),
    where("userId", "==", currentUser.uid)
  );

  try {
    const clientsSnap = await getDocs(clientQuery);
    const projectsSnap = await getDocs(projectQuery);

    totalClients.textContent = clientsSnap.size;
    totalProjects.textContent = projectsSnap.size;

    let earnings = 0;
    let pending = 0;

    const projectsByClient = {};

    projectsSnap.forEach(docSnap => {
      const data = docSnap.data();

      earnings += data.totalPrice || 0;
      pending += data.remaining || 0;

      const matchesSearch =
        (data.title?.toLowerCase() || '').includes(searchValue) ||
        (data.clientName?.toLowerCase() || '').includes(searchValue);

      const matchesStatus =
        statusValue === "All" || data.status === statusValue;

      const matchesPayment =
        paymentValue === "All" ||
        (paymentValue === "Paid" && (data.remaining === 0 || data.remaining <= 0)) ||
        (paymentValue === "Unpaid" && data.remaining > 0);

      if (matchesSearch && matchesStatus && matchesPayment) {
        if (!projectsByClient[data.clientId])
          projectsByClient[data.clientId] = [];

        projectsByClient[data.clientId].push({
          id: docSnap.id,
          ...data
        });
      }
    });

    totalEarnings.textContent = `Rs ${earnings.toLocaleString()}`;
    pendingPayments.textContent = `Rs ${pending.toLocaleString()}`;

    if (clientsSnap.size === 0) {
      clientsContainer.innerHTML = '<div class="card" style="grid-column: 1/-1; text-align: center; padding: 3rem;"><i class="fas fa-users" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i><h3>No clients yet</h3><p>Click "Add Client" to get started</p></div>';
      return;
    }

    clientsSnap.forEach(clientDoc => {
      const client = clientDoc.data();
      const clientId = clientDoc.id;

      const clientMatchesSearch =
        (client.name?.toLowerCase() || '').includes(searchValue);

      const clientProjects = projectsByClient[clientId] || [];

      if (!clientMatchesSearch && clientProjects.length === 0) return;

      const div = document.createElement("div");
      div.classList.add("card");

      div.innerHTML = `
        <h3><i class="fas fa-user-circle"></i> ${client.name || ''}</h3>
        <p><i class="fas fa-phone"></i> ${client.phone || 'No phone'}</p>
        <p><i class="fas fa-envelope"></i> ${client.email || 'No email'}</p>
        <p><i class="fas fa-sticky-note"></i> ${client.notes || 'No notes'}</p>
        <div class="client-actions">
          <button class="small-btn" data-invoice="${clientId}">
            <i class="fas fa-file-invoice"></i> Generate Invoice
          </button>
          <button class="small-btn" data-delete-client="${clientId}">
            <i class="fas fa-trash"></i> Delete Client
          </button>
        </div>

        <div class="projects-section"></div>
      `;

      const projectSection = div.querySelector(".projects-section");

      if (clientProjects.length === 0) {
        projectSection.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;"><i class="fas fa-folder-open"></i> No projects yet</p>';
      } else {
        clientProjects.forEach(project => {
          const pDiv = document.createElement("div");
          pDiv.classList.add("project-item");
          pDiv.setAttribute('data-status', project.status || 'Pending');

          let statusIcon = 'fa-clock';
          if (project.status === 'In Progress') statusIcon = 'fa-spinner';
          if (project.status === 'Completed') statusIcon = 'fa-check-circle';
          if (project.status === 'Delivered') statusIcon = 'fa-box';

          pDiv.innerHTML = `
            <strong><i class="fas ${statusIcon}"></i> ${project.title || 'Untitled'}</strong>
            <p><i class="fas fa-tag"></i> Total: Rs ${(project.totalPrice || 0).toLocaleString()}</p>
            <p><i class="fas fa-credit-card"></i> Remaining: Rs ${(project.remaining || 0).toLocaleString()}</p>
            <p><i class="fas fa-chart-line"></i> Status: ${project.status || 'Pending'}</p>
            <p><i class="fas fa-calendar"></i> Deadline: ${project.deadline || 'Not set'}</p>
            <div class="project-actions">
              <button class="small-btn" data-pay="${project.id}"><i class="fas fa-plus-circle"></i> Add Payment</button>
              <button class="small-btn" data-edit="${project.id}"><i class="fas fa-edit"></i> Edit</button>
              <button class="small-btn" data-delete="${project.id}"><i class="fas fa-trash"></i> Delete</button>
            </div>
          `;

          projectSection.appendChild(pDiv);
        });
      }

      clientsContainer.appendChild(div);
    });

    attachProjectActions();
    attachClientDelete();
    attachInvoiceGenerator(projectsByClient, clientsSnap);
  } catch (error) {
    await Popup.error("Error loading data: " + error.message);
  }
}

/* ---------------- ACTION HANDLERS ---------------- */

async function editProject(projectId) {
  try {
    // Fetch project data
    const projectQuery = query(
      collection(db, "projects"),
      where("__name__", "==", projectId),
      where("userId", "==", currentUser.uid)
    );

    const snap = await getDocs(projectQuery);

    if (snap.empty) {
      await Popup.error("Project not found");
      return;
    }

    const projectDoc = snap.docs[0];
    const projectData = projectDoc.data();

    // Set editing mode
    editingProjectId = projectId;

    // Load client options first
    await loadClientOptions();

    // Pre-fill the form
    projectClient.value = projectData.clientId;
    document.getElementById("projectTitle").value = projectData.title || '';
    document.getElementById("projectTotal").value = projectData.totalPrice || '';
    document.getElementById("projectAdvance").value = projectData.advance || 0;
    document.getElementById("projectDeadline").value = projectData.deadline || '';

    // Set status dropdown
    const statusSelect = document.getElementById("projectStatus");
    statusSelect.value = projectData.status || 'Pending';
    if (projectStatusDropdown) {
      projectStatusDropdown.setValue(projectData.status || 'Pending');
    }

    // Open panel
    projectPanel.classList.add("active");

  } catch (error) {
    await Popup.error("Error loading project: " + error.message);
  }
}

function attachProjectActions() {
  document.querySelectorAll("[data-pay]").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.pay;
      const amount = await Popup.prompt("Enter payment received amount:", "Add Payment");

      if (!amount || amount <= 0) return;

      try {
        const projectRef = doc(db, "projects", id);
        const snap = await getDocs(query(collection(db, "projects"), where("__name__", "==", id)));

        snap.forEach(async d => {
          const data = d.data();

          const totalPrice = Number(data.totalPrice) || 0;
          const currentRemaining = Number(data.remaining) || 0;
          const paymentAmount = Number(amount);

          const newRemaining = Math.max(0, currentRemaining - paymentAmount);
          const newAdvance = totalPrice - newRemaining;

          await updateDoc(projectRef, {
            remaining: newRemaining,
            advance: newAdvance
          });
        });


        await Popup.success("Payment added successfully!");
        loadAllData();
      } catch (error) {
        await Popup.error("Error adding payment: " + error.message);
      }
    };
  });

  document.querySelectorAll("[data-delete]").forEach(btn => {
    btn.onclick = async () => {
      const confirmed = await Popup.confirm("Are you sure you want to delete this project?");
      if (!confirmed) return;

      try {
        await deleteDoc(doc(db, "projects", btn.dataset.delete));
        await Popup.success("Project deleted successfully!");
        loadAllData();
      } catch (error) {
        await Popup.error("Error deleting project: " + error.message);
      }
    };
  });

  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = async () => {
      await editProject(btn.dataset.edit);
    };
  });
}

/* ---------------- CLIENT DROPDOWN ---------------- */

async function loadClientOptions() {
  projectClient.innerHTML = '<option value="">Select a client...</option>';

  const q = query(
    collection(db, "clients"),
    where("userId", "==", currentUser.uid)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    projectClient.innerHTML = '<option value="">No clients available. Add a client first.</option>';
    return;
  }

  snapshot.forEach(docSnap => {
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = docSnap.data().name;
    projectClient.appendChild(option);
  });
}

function attachClientDelete() {
  document.querySelectorAll("[data-delete-client]").forEach(btn => {
    btn.onclick = async () => {
      const confirmed = await Popup.confirm(
        "Delete this client and ALL their projects? This action cannot be undone."
      );

      if (!confirmed) return;

      const clientId = btn.dataset.deleteClient;

      try {
        // Show loading state
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

        // Get all related projects
        const q = query(
          collection(db, "projects"),
          where("clientId", "==", clientId),
          where("userId", "==", currentUser.uid)
        );

        const snap = await getDocs(q);

        // Delete projects
        for (const projectDoc of snap.docs) {
          await deleteDoc(doc(db, "projects", projectDoc.id));
        }

        // Delete client
        await deleteDoc(doc(db, "clients", clientId));

        await Popup.success("Client and all projects deleted successfully!");
        loadAllData();
      } catch (error) {
        console.error("Error deleting client:", error);
        await Popup.error("Error deleting client. Please try again.");
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash"></i> Delete Client';
      }
    };
  });
}

function attachInvoiceGenerator(projectsByClient, clientsSnap) {
  document.querySelectorAll("[data-invoice]").forEach(btn => {
    btn.onclick = async () => {
      const clientId = btn.dataset.invoice;

      const clientDoc = clientsSnap.docs.find(doc => doc.id === clientId);
      if (!clientDoc) return;

      const client = clientDoc.data();
      const projects = projectsByClient[clientId] || [];

      generateInvoicePDF(client, projects);
    };
  });
}


// Search input with debounce
let searchTimeout;
document.getElementById("searchInput").addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    showSkeleton();
    loadAllData();
  }, 500);
});

// Close panels on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    clientPanel.classList.remove('active');
    projectPanel.classList.remove('active');
    editingProjectId = null;
  }
});

// Click outside to close panels
document.addEventListener('click', (e) => {
  if (!clientPanel.contains(e.target) && !addClientBtn.contains(e.target) && clientPanel.classList.contains('active')) {
    clientPanel.classList.remove('active');
  }
  if (!projectPanel.contains(e.target) && !addProjectBtn.contains(e.target) && projectPanel.classList.contains('active')) {
    projectPanel.classList.remove('active');
    editingProjectId = null;
  }
});


async function getImageDimensions(base64) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function () {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.src = base64;
  });
}



async function generateInvoicePDF(client, projects, preview = false) {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    compress: true
  });


  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const invoiceNumber = "INV-" + Date.now().toString().slice(-6);
  const today = new Date().toLocaleDateString();

  let totalAmount = 0;
  let totalAdvance = 0;
  let totalRemaining = 0;

  // 🔥 CONTROL MAIN CONTENT SPACING HERE
  const contentStartY = 58;

  // =========================
  // IMAGE LOADER
  // =========================

  async function loadImageAsBase64(url, quality = 0.6) {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Resize image (VERY IMPORTANT)
        const maxWidth = 800; // adjust if needed
        const scale = Math.min(1, maxWidth / img.width);

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to JPEG with compression
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.src = URL.createObjectURL(blob);
    });
  }


  async function getImageDimensions(base64) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = base64;
    });
  }

  const headerLogo = await loadImageAsBase64("/header.png");
  const signatureBase64 = await loadImageAsBase64("/signature.png");
  const meezanLogo = await loadImageAsBase64("/meezan.png");
  const easypaisaLogo = await loadImageAsBase64("/Easypaisa-logo-2.png");

  // =========================
  // HEADER (REPEATS)
  // =========================

  async function drawHeader() {
    const headerHeightBar = 38;

    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, headerHeightBar, "F");

    const headerDims = await getImageDimensions(headerLogo);
    const logoWidth = 40;
    const logoHeight = (headerDims.height / headerDims.width) * logoWidth;

    // 🔥 Calculate total content height (logo + text lines + spacing)
    const lineGap = 5;
    const totalContentHeight = logoHeight + 2 + 9 + 9;
    // 2 = gap under logo
    // 9 = Freelance Digital Services
    // 9 = Email + Phone combined height approx

    // 🔥 Center the whole block vertically inside header bar
    const visualOffset = 3; // try 2 or 3 if needed
    const contentStartY = (headerHeightBar - totalContentHeight) / 2 + visualOffset;


    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = contentStartY;

    doc.addImage(headerLogo, "JPEG", logoX, logoY, logoWidth, logoHeight);

    const textStartY = logoY + logoHeight + 3;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255);
    doc.text("Freelance Digital Services", pageWidth / 2, textStartY, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(240, 240, 240);
    doc.text("Email: themed.edits.co@gmail.com", pageWidth / 2, textStartY + 5, { align: "center" });
    doc.text("Phone : +92 332 3954620", pageWidth / 2, textStartY + 10, { align: "center" });

    doc.setTextColor(0);
  }


  // =========================
  // FOOTER (REPEATS)
  // =========================

  function drawFooter(pageNumber, totalPages) {

    doc.setFontSize(9);
    doc.setTextColor(120);

    // Fixed: Set consistent line color for all pages
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);

    doc.text(
      "Thank you for your business. Kindly share payment confirmation after transfer.",
      pageWidth / 2,
      pageHeight - 13,
      { align: "center" }
    );

    doc.text(
      `Page ${pageNumber} of ${totalPages}`,
      pageWidth - 15,
      pageHeight - 7,
      { align: "right" }
    );

    doc.setTextColor(0);
  }

  // =========================
  // START FIRST PAGE
  // =========================

  await drawHeader();

  // =========================
  // ENHANCED CLIENT SECTION (LEFT) - FIXED MARGINS
  // =========================

  // Add light background for client section - kept within margins
  doc.setFillColor(245, 247, 250);
  doc.rect(15, contentStartY - 5, 80, 28, "F"); // Changed from 10 to 15 (left margin)

  // Add subtle border
  doc.setDrawColor(200, 210, 220);
  doc.setLineWidth(0.5);
  doc.rect(15, contentStartY - 5, 80, 28, "S"); // Changed from 10 to 15

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("BILL TO :", 20, contentStartY); // Adjusted from 15 to 20

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(client.name || "", 20, contentStartY + 7); // Adjusted from 15 to 20

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(client.phone || "N/A", 20, contentStartY + 13); // Adjusted from 15 to 20
  doc.text(client.email || "N/A", 20, contentStartY + 19); // Adjusted from 15 to 20

  // =========================
  // ENHANCED INVOICE DETAILS (RIGHT) - FIXED MARGINS
  // =========================

  // Add light background for invoice details - kept within margins
  doc.setFillColor(245, 247, 250);
  doc.rect(pageWidth - 95, contentStartY - 5, 80, 28, "F"); // Changed width to 80 to match left side

  // Add subtle border
  doc.setDrawColor(200, 210, 220);
  doc.setLineWidth(0.5);
  doc.rect(pageWidth - 95, contentStartY - 5, 80, 28, "S"); // Changed width to 80

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("INVOICE DETAILS", pageWidth - 20, contentStartY, { align: "right" }); // Changed from -15 to -20

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(`Invoice #: ${invoiceNumber}`, pageWidth - 20, contentStartY + 7, { align: "right" }); // Changed from -15 to -20
  doc.text(`Date: ${today}`, pageWidth - 20, contentStartY + 13, { align: "right" }); // Changed from -15 to -20

  // =========================
  // PROJECT TABLE
  // =========================

  const tableStartY = contentStartY + 35;

  const tableData = projects.map(project => {

    const total = Number(project.totalPrice) || 0;
    const advance = Number(project.advance) || 0;
    const remaining = Number(project.remaining) || 0;

    totalAmount += total;
    totalAdvance += advance;
    totalRemaining += remaining;

    return [
      project.title || "",
      project.status || "",
      "Rs " + total.toLocaleString(),
      "Rs " + advance.toLocaleString(),
      "Rs " + remaining.toLocaleString()
    ];
  });

  doc.autoTable({
    startY: tableStartY,
    head: [["Project", "Status", "Total", "Advance", "Remaining"]],
    body: tableData,
    theme: "grid",
    margin: { left: 15, right: 15 },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 4
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    // Add total row at the bottom
    foot: [["", "", "", "", "Total Rs " + totalRemaining.toLocaleString()]],
    footStyles: {
      fillColor: [0, 0, 0],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'right'
    },
    columnStyles: {
      4: { halign: 'right' } // Right align the remaining column
    }
  });

  let currentY = doc.lastAutoTable.finalY + 15;

  // =========================
  // ENHANCED SUMMARY SECTION - FIXED VERTICAL ALIGNMENT
  // =========================

  if (currentY > pageHeight - 80) {
    doc.addPage();
    await drawHeader();
    currentY = contentStartY;
  }

  // Add background and border for summary section
  doc.setFillColor(240, 244, 248);
  doc.rect(15, currentY - 5, pageWidth - 30, 34, "F"); // Adjusted width and added more height

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(15, currentY - 5, pageWidth - 30, 34, "S"); // Adjusted width

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("SUMMARY", 20, currentY + 2); // Adjusted from 15 to 20

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Total Amount:`, 20, currentY + 9); // Adjusted Y position
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(`Rs ${totalAmount.toLocaleString()}`, 55, currentY + 9); // Adjusted X and Y

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  doc.text(`Total Paid:`, 20, currentY + 16); // Adjusted Y position
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 100, 0);
  doc.text(`Rs ${totalAdvance.toLocaleString()}`, 55, currentY + 16); // Adjusted X and Y

  // Add line above Total Remaining
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(20, currentY + 20, pageWidth - 25, currentY + 20); // Line from left to right margin

  doc.setFont("helvetica", "bold");
  doc.setTextColor(200, 0, 0);
  doc.text(`Total Remaining:`, 20, currentY + 25); // Adjusted Y position
  doc.text(`Rs ${totalRemaining.toLocaleString()}`, 55, currentY + 25); // Adjusted X and Y
  doc.setTextColor(0);

  currentY += 45; // Increased from 40 to give more space

  // =========================
  // PAYMENT SECTION
  // =========================

  if (currentY > pageHeight - 90) {
    doc.addPage();
    await drawHeader();
    currentY = contentStartY;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Payment Information", 20, currentY); // Adjusted from 15 to 20
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(20, currentY + 4, pageWidth - 20, currentY + 4); // Adjusted margins

  const meezanDims = await getImageDimensions(meezanLogo);
  const bankWidth = 14;
  const bankHeight = (meezanDims.height / meezanDims.width) * bankWidth;

  doc.addImage(meezanLogo, "JPEG", 20, currentY + 13, bankWidth, bankHeight); // Adjusted from 15 to 20

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Meezan Bank Limited", 45, currentY + 16); // Adjusted from 40 to 45
  doc.setFont("helvetica", "normal");
  doc.text("Account Title: HAMMAD AHMED SARDAR", 45, currentY + 22); // Adjusted from 40 to 45
  doc.text("Account Number: 99560111470100", 45, currentY + 28); // Adjusted from 40 to 45
  doc.text("IBAN: PK09MEZN0099560111470100", 45, currentY + 34); // Adjusted from 40 to 45

  const easyDims = await getImageDimensions(easypaisaLogo);
  const easyHeight = (easyDims.height / easyDims.width) * bankWidth;

  doc.addImage(easypaisaLogo, "JPEG", 20, currentY + 43, bankWidth, easyHeight); // Adjusted from 15 to 20

  doc.setFont("helvetica", "bold");
  doc.text("Easypaisa", 45, currentY + 46); // Adjusted from 40 to 45
  doc.setFont("helvetica", "normal");
  doc.text("Account Title: HAMMAD AHMED SARDAR", 45, currentY + 52); // Adjusted from 40 to 45
  doc.text("Number: 0332-3954620", 45, currentY + 58); // Adjusted from 40 to 45

  currentY += 75;

  // =========================
  // SIGNATURE
  // =========================

  // =========================
  // SIGNATURE - MOVED TO BOTTOM OF LAST PAGE
  // =========================

  // Get the last page number
  const totalPages = doc.getNumberOfPages();
  doc.setPage(totalPages);

  // Calculate position at bottom of page (above footer)
  const footerHeight = 25; // Space reserved for footer
  const signatureY = pageHeight - footerHeight - 26; // 25mm above footer

  const signDims = await getImageDimensions(signatureBase64);
  const signWidth = 20;
  const signHeight = (signDims.height / signDims.width) * signWidth;

  doc.addImage(signatureBase64, "JPEG", pageWidth - 55, signatureY, signWidth, signHeight);

  // Line above Authorized Signature
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 65, signatureY + signHeight + 0, pageWidth - 25, signatureY + signHeight + 0);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Authorized Signature", pageWidth - 45, signatureY + signHeight + 4.5, { align: "center" });


  // =========================
  // ADD FOOTERS TO ALL PAGES
  // =========================


  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  // =========================
  // SAVE / PREVIEW
  // =========================

  if (preview) {
    window.open(doc.output("bloburl"));
  } else {
    const safeClientName = (client.name || "Client").trim();
    doc.save(`${safeClientName} - ${invoiceNumber}.pdf`);
  }
}