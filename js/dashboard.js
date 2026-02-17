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
    window.location.href = "index.html";
  } else {
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
  window.location.href = "index.html";
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
          const newRemaining = (data.remaining || 0) - Number(amount);
          await updateDoc(projectRef, {
            remaining: newRemaining < 0 ? 0 : newRemaining
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



async function generateInvoicePDF(client, projects) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const invoiceNumber = "INV-" + Date.now().toString().slice(-6);
  const today = new Date().toLocaleDateString();

  let totalAmount = 0;
  let totalAdvance = 0;
  let totalRemaining = 0;

  // =========================
  // LOAD IMAGES
  // =========================

  async function loadImageAsBase64(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  const logoBase64 = await loadImageAsBase64("logo.png");
  const signatureBase64 = await loadImageAsBase64("signature.png");

  // =========================
  // HEADER BAR
  // =========================

  doc.setFillColor(15, 23, 42); // dark navy
  doc.rect(0, 0, 210, 12, "F");

  // =========================
  // WATERMARK (FADED LOGO)
  // =========================

  doc.setGState(new doc.GState({ opacity: 0.04 }));
  doc.addImage(logoBase64, "PNG", 40, 80, 130, 130);
  doc.setGState(new doc.GState({ opacity: 1 }));

  // =========================
  // LOGO (TOP LEFT)
  // =========================

  const logoDims = await getImageDimensions(logoBase64);

  const logoWidth = 20; // fixed width
  const logoHeight = (logoDims.height / logoDims.width) * logoWidth;

  doc.addImage(logoBase64, "PNG", 14, 18, logoWidth, logoHeight);


  // =========================
  // INVOICE INFO (TOP RIGHT)
  // =========================

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 150, 25);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice No: ${invoiceNumber}`, 150, 33);
  doc.text(`Date: ${today}`, 150, 39);

  // =========================
  // BUSINESS INFO
  // =========================

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Themed Edits", 14, 45);

  doc.setFont("helvetica", "normal");
  doc.text("Freelance Digital Services", 14, 51);
  doc.text("Email: themed.edits.co@gmail.com", 14, 57);

  doc.line(14, 63, 195, 63);

  // =========================
  // CLIENT SECTION
  // =========================

  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, 73);

  doc.setFont("helvetica", "normal");
  doc.text(client.name || "", 14, 81);
  doc.text(client.email || "N/A", 14, 87);
  doc.text(client.phone || "N/A", 14, 93);

  if (client.notes) {
    doc.text("Notes: " + client.notes, 14, 99);
  }

  // =========================
  // PROJECT TABLE
  // =========================

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
      "Rs " + total,
      "Rs " + advance,
      "Rs " + remaining
    ];
  });

  doc.autoTable({
    startY: 110,
    head: [["Project", "Status", "Total", "Advance", "Remaining"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontStyle: "bold"
    },
    styles: {
      fontSize: 10,
      cellPadding: 4
    }
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // =========================
  // SUMMARY
  // =========================

  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, finalY);

  doc.setFont("helvetica", "normal");
  doc.text(`Total Amount: Rs ${totalAmount}`, 14, finalY + 8);
  doc.text(`Total Paid ( Advance ): Rs ${totalAdvance}`, 14, finalY + 14);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(200, 0, 0);
  doc.text(`Total Remaining: Rs ${totalRemaining}`, 14, finalY + 22);
  doc.setTextColor(0, 0, 0);

  // =========================
  // SIGNATURE + FOOTER (Same Horizontal Line)
  // =========================

  const pageHeight = doc.internal.pageSize.height;
  const lineY = pageHeight - 15; // same horizontal level

  // ---- SIGNATURE TEXT (Right Side) ----
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const signatureText = "Authorized Signature";
  const textWidth = doc.getTextWidth(signatureText);
  const textX = 163; // right area position

  doc.text(signatureText, textX, lineY);

  // ---- SIGNATURE IMAGE (Centered Above Text) ----
  const signDims = await getImageDimensions(signatureBase64);

  const signWidth = 25; // adjust if needed
  const signHeight = (signDims.height / signDims.width) * signWidth;

  // Center image relative to text
  const imageX = textX - (signWidth / 2) + (textWidth / 2);
  const imageY = lineY - signHeight - 5;

  doc.addImage(signatureBase64, "PNG", imageX, imageY, signWidth, signHeight);

  // ---- FOOTER TEXT (Left Side, Same Line) ----
  doc.setFontSize(9);
  doc.text(
    "Thank you for your business. Payment is due as per agreed terms.",
    14,
    lineY
  );


  // =========================
  // SAVE FILE
  // =========================

  const safeClientName = (client.name || "Client").trim();
  doc.save(`${safeClientName} - ${invoiceNumber}.pdf`);
}