import React, { useEffect, useMemo, useState } from "react";
import {
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaUserSlash,
  FaLayerGroup,
  FaUpload,
  FaDownload,
  FaSearch,
  FaFilter,
  FaEye,
  FaPlus,
  FaTrash,
  FaUserPlus,
  FaArrowLeft,
  FaTimes,
  FaBan,
  FaUnlock,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaWhatsapp,
  FaFacebook,
  FaCheckCircle
} from "react-icons/fa";

export default function Admin_WhatsApp_Customers() {
  const [activeSection, setActiveSection] = useState("customers");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [managingGroupId, setManagingGroupId] = useState(null);
  const [manageMemberIds, setManageMemberIds] = useState([]);

  const [customers, setCustomers] = useState(() => {
    const savedCustomers = localStorage.getItem(
      "admin_whatsapp_customers"
    );

    if (savedCustomers) {
      try {
        return JSON.parse(savedCustomers);
      } catch (error) {
        console.error(
          "Failed to load saved customers:",
          error
        );
      }
    }

    return [
      {
        id: 1,
        name: "Rahul Sharma",
        phone: "+91 9876543210",
        email: "rahul@example.com",
        city: "Hyderabad",
        source: "WhatsApp",
        status: "Active"
      },
      {
        id: 2,
        name: "Priya Reddy",
        phone: "+91 9123456780",
        email: "priya@example.com",
        city: "Hyderabad",
        source: "Website",
        status: "Active"
      },
      {
        id: 3,
        name: "Arjun Kumar",
        phone: "+91 9988776655",
        email: "arjun@example.com",
        city: "Bangalore",
        source: "WhatsApp",
        status: "Inactive"
      },
      {
        id: 4,
        name: "Sneha Patel",
        phone: "+91 9001122334",
        email: "sneha@example.com",
        city: "Mumbai",
        source: "Facebook",
        status: "Active"
      },
      {
        id: 5,
        name: "Vikram Singh",
        phone: "+91 9556677889",
        email: "vikram@example.com",
        city: "Delhi",
        source: "Website",
        status: "Inactive"
      },
      {
        id: 6,
        name: "Ananya Rao",
        phone: "+91 9445566778",
        email: "ananya@example.com",
        city: "Chennai",
        source: "WhatsApp",
        status: "Blocked"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem(
      "admin_whatsapp_customers",
      JSON.stringify(customers)
    );
  }, [customers]);

  const [groups, setGroups] = useState([
    {
      id: 1,
      name: "Product A Interested Customers",
      description: "Customers interested in Product A",
      members: [1]
    },
    {
      id: 2,
      name: "Premium Customers",
      description: "Important and premium customers",
      members: [1, 4]
    }
  ]);

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    source: "WhatsApp",
    status: "Active"
  });

  const [newGroup, setNewGroup] = useState({
    name: "",
    description: ""
  });

  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active"
  ).length;

  const inactiveCustomers = customers.filter(
    (customer) => customer.status === "Inactive"
  ).length;

  const blockedCustomers = customers.filter(
    (customer) => customer.status === "Blocked"
  ).length;

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        customer.name.toLowerCase().includes(search) ||
        customer.phone.toLowerCase().includes(search) ||
        customer.email.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleBlockCustomer = (id) => {
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === id
          ? { ...customer, status: "Blocked" }
          : customer
      )
    );

    setSelectedCustomer((prev) =>
      prev && prev.id === id
        ? { ...prev, status: "Blocked" }
        : prev
    );
  };

  const handleDeleteCustomer = (id) => {
    setCustomers((prevCustomers) =>
      prevCustomers.filter((customer) => customer.id !== id)
    );
  };

  const handleUnblockCustomer = (id) => {
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === id
          ? { ...customer, status: "Active" }
          : customer
      )
    );

    setSelectedCustomer((prev) =>
      prev && prev.id === id
        ? { ...prev, status: "Active" }
        : prev
    );
  };

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) return;

    const customer = {
      id: Date.now(),
      ...newCustomer
    };

    setCustomers((prev) => [...prev, customer]);

    setNewCustomer({
      name: "",
      phone: "",
      email: "",
      city: "",
      source: "WhatsApp",
      status: "Active"
    });

    setShowAddCustomer(false);
  };

  const handleCreateGroup = () => {
    if (!newGroup.name) return;

    setGroups((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newGroup.name,
        description: newGroup.description,
        members: []
      }
    ]);

    setNewGroup({
      name: "",
      description: ""
    });

    setShowCreateGroup(false);
  };

  const handleViewGroup = (group) => {
    setSelectedGroupId(group.id);
    setManagingGroupId(null);
    setManageMemberIds([]);
    setSelectedCustomer(null);
    setActiveSection("groups");
  };

  const handleManageMembers = (group) => {
    setManagingGroupId(group.id);
    setSelectedGroupId(null);
    setManageMemberIds(group.members);
    setSelectedCustomer(null);
    setActiveSection("groups");
  };

  const handleMemberCheckbox = (customerId) => {
    setManageMemberIds((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSaveGroupMembers = () => {
    if (!managingGroupId) return;

    setGroups((prev) =>
      prev.map((group) =>
        group.id === managingGroupId
          ? { ...group, members: manageMemberIds }
          : group
      )
    );

    setManagingGroupId(null);
    setManageMemberIds([]);
  };

  const handleDeleteGroup = (groupId) => {
    setGroups((prev) =>
      prev.filter((group) => group.id !== groupId)
    );

    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    }

    if (managingGroupId === groupId) {
      setManagingGroupId(null);
      setManageMemberIds([]);
    }
  };

  const renderGroupDetails = () => {
    const group = groups.find(
      (item) => item.id === selectedGroupId
    );

    if (!group) {
      setSelectedGroupId(null);
      return null;
    }

    const groupMembers = customers.filter((customer) =>
      group.members.includes(customer.id)
    );

    return (
      <div className="group-details-page">
        <button
          className="back-button"
          onClick={() => setSelectedGroupId(null)}
        >
          <FaArrowLeft /> Back to Groups
        </button>

        <div className="group-detail-header">
          <div className="group-detail-icon">
            <FaLayerGroup />
          </div>

          <div className="group-detail-heading">
            <h2>{group.name}</h2>
            <p>
              {group.description ||
                "No group description provided."}
            </p>
          </div>

          <div className="group-detail-count">
            <FaUsers />
            <strong>{groupMembers.length}</strong>
            <span>Members</span>
          </div>
        </div>

        <div className="group-detail-card">
          <div className="group-detail-section-header">
            <div>
              <h3>Group Members</h3>
              <p>
                Customers currently included in this group.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={() => handleManageMembers(group)}
            >
              <FaUserPlus /> Manage Members
            </button>
          </div>

          {groupMembers.length > 0 ? (
            <div className="group-member-list">
              {groupMembers.map((customer) => (
                <div
                  className="group-member-row"
                  key={customer.id}
                >
                  <div className="customer-name-cell">
                    <div className="customer-avatar">
                      {customer.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>{customer.name}</strong>
                      <span>
                        Customer ID: #{customer.id}
                      </span>
                    </div>
                  </div>

                  <div className="group-member-contact">
                    <span>
                      <FaPhone /> {customer.phone}
                    </span>

                    <span>
                      <FaEnvelope /> {customer.email}
                    </span>
                  </div>

                  <span className="location-cell">
                    <FaMapMarkerAlt /> {customer.city}
                  </span>

                  <span
                    className={`status-badge ${getStatusClass(
                      customer.status
                    )}`}
                  >
                    {customer.status}
                  </span>

                  <button
                    className="view-button"
                    onClick={() =>
                      handleViewCustomer(customer)
                    }
                  >
                    <FaEye /> View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state group-empty">
              <FaUsers />
              <h3>No Members in This Group</h3>
              <p>
                Add customers using the Manage Members
                option.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  handleManageMembers(group)
                }
              >
                <FaUserPlus /> Add Members
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderManageMembers = () => {
    const group = groups.find(
      (item) => item.id === managingGroupId
    );

    if (!group) {
      setManagingGroupId(null);
      setManageMemberIds([]);
      return null;
    }

    return (
      <div className="manage-members-page">
        <button
          className="back-button"
          onClick={() => {
            setManagingGroupId(null);
            setManageMemberIds([]);
          }}
        >
          <FaArrowLeft /> Back to Groups
        </button>

        <div className="manage-members-header">
          <div>
            <h2>Manage Members</h2>
            <p>{group.name}</p>
            <span>
              {group.description ||
                "No group description provided."}
            </span>
          </div>

          <div className="selected-member-count">
            <FaUsers />
            <strong>{manageMemberIds.length}</strong>
            <span>Selected</span>
          </div>
        </div>

        <div className="manage-members-card">
          <div className="manage-members-top">
            <div>
              <h3>Select Customers</h3>
              <p>
                Choose which customers should belong to
                this group.
              </p>
            </div>

            <div className="member-selection-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  setManageMemberIds(
                    customers.map(
                      (customer) => customer.id
                    )
                  )
                }
              >
                Select All
              </button>

              <button
                className="cancel-button"
                onClick={() => setManageMemberIds([])}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="member-checkbox-list">
            {customers.map((customer) => (
              <label
                className="member-checkbox-row"
                key={customer.id}
              >
                <input
                  type="checkbox"
                  checked={manageMemberIds.includes(
                    customer.id
                  )}
                  onChange={() =>
                    handleMemberCheckbox(customer.id)
                  }
                />

                <div className="customer-avatar">
                  {customer.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="member-checkbox-info">
                  <strong>{customer.name}</strong>
                  <span>{customer.phone}</span>
                  <small>{customer.email}</small>
                </div>

                <div className="member-checkbox-location">
                  <FaMapMarkerAlt /> {customer.city}
                </div>

                <span
                  className={`status-badge ${getStatusClass(
                    customer.status
                  )}`}
                >
                  {customer.status}
                </span>
              </label>
            ))}
          </div>

          <div className="manage-members-footer">
            <button
              className="cancel-button"
              onClick={() => {
                setManagingGroupId(null);
                setManageMemberIds([]);
              }}
            >
              Cancel
            </button>

            <button
              className="primary-button"
              onClick={handleSaveGroupMembers}
            >
              <FaCheckCircle /> Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleExport = () => {
    const headers = [
      "Name",
      "Phone",
      "Email",
      "City",
      "Source",
      "Status"
    ];

    const rows = customers.map((customer) => [
      customer.name,
      customer.phone,
      customer.email,
      customer.city,
      customer.source,
      customer.status
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${value}"`).join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "customers.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      const rows = text.split("\n").filter((row) => row.trim());

      const existingNumbers = new Set(
        customers.map((customer) =>
          String(customer.phone || "").replace(/\D/g, "")
        )
      );

      const importedNumbers = new Set();
      const importedCustomers = [];

      rows.slice(1).forEach((row, index) => {
        const columns = row
          .split(",")
          .map((item) => item.trim());

        const name = columns[0] || "";
        const phone = columns[1] || "";
        const email = columns[2] || "";
        const location = columns[3] || "";
        const source = columns[4] || "";

        const normalizedPhone = phone.replace(/\D/g, "");

        if (!normalizedPhone) return;

        if (
          existingNumbers.has(normalizedPhone) ||
          importedNumbers.has(normalizedPhone)
        ) {
          return;
        }

        importedNumbers.add(normalizedPhone);

        importedCustomers.push({
          id: Date.now() + index,
          name,
          phone,
          email,
          location,
          source,
          status: "Active",
          groups: []
        });
      });

      if (importedCustomers.length > 0) {
        setCustomers((prev) => [
          ...prev,
          ...importedCustomers
        ]);
      }

      const skippedCount =
        rows.slice(1).filter((row) => row.trim()).length -
        importedCustomers.length;

      if (skippedCount > 0) {
        alert(
          `${importedCustomers.length} customer(s) imported successfully. ${skippedCount} duplicate customer(s) were skipped.`
        );
      } else {
        alert(
          `${importedCustomers.length} customer(s) imported successfully.`
        );
      }
    };

    reader.readAsText(file);

    event.target.value = "";
  };

  const getSourceIcon = (source) => {
    if (source === "WhatsApp") {
      return <FaWhatsapp />;
    }

    if (source === "Facebook") {
      return <FaFacebook />;
    }

    return <FaGlobe />;
  };

  const getStatusClass = (status) => {
    if (status === "Active") return "status-active";
    if (status === "Inactive") return "status-inactive";
    return "status-blocked";
  };

  const renderCustomerTable = (customerList) => {
    return (
      <div className="customer-table-wrapper">
        <table className="customer-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Source</th>
              <th>Status</th>
              <th>Action</th>
              <th>Delete</th>
            </tr>
          </thead>

          <tbody>
            {customerList.length > 0 ? (
              customerList.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="customer-name-cell">
                      <div className="customer-avatar">
                        {customer.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>{customer.name}</strong>
                        <span>
                          Customer ID: #{customer.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="contact-cell">
                      <span>
                        <FaPhone /> {customer.phone}
                      </span>

                      <span>
                        <FaEnvelope /> {customer.email}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span className="location-cell">
                      <FaMapMarkerAlt /> {customer.city}
                    </span>
                  </td>

                  <td>
                    <span className="source-cell">
                      {getSourceIcon(customer.source)}
                      {customer.source}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status-badge ${getStatusClass(
                        customer.status
                      )}`}
                    >
                      {customer.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="view-button"
                      onClick={() =>
                        handleViewCustomer(customer)
                      }
                    >
                      <FaEye /> View
                    </button>
                  </td>

                  <td>
                    <button
                      className="delete-button"
                      onClick={() =>
                        handleDeleteCustomer(customer.id)
                      }
                      title="Delete Customer"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <FaUsers />
                    <h3>No customers found</h3>
                    <p>
                      There are no customers matching
                      your selection.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCustomerProfile = () => {
    if (!selectedCustomer) return null;

    return (
      <div className="profile-page">
        <button
          className="back-button"
          onClick={() => setSelectedCustomer(null)}
        >
          <FaArrowLeft /> Back
        </button>

        <div className="profile-card">
          <div className="profile-top">
            <div className="large-avatar">
              {selectedCustomer.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="profile-main">
              <h2>{selectedCustomer.name}</h2>

              <span
                className={`status-badge ${getStatusClass(
                  selectedCustomer.status
                )}`}
              >
                {selectedCustomer.status}
              </span>

              <p>
                Customer ID: #{selectedCustomer.id}
              </p>
            </div>

            <div className="profile-actions">
              {selectedCustomer.status === "Blocked" ? (
                <button
                  className="unblock-button"
                  onClick={() =>
                    handleUnblockCustomer(
                      selectedCustomer.id
                    )
                  }
                >
                  <FaUnlock /> Unblock Customer
                </button>
              ) : (
                <button
                  className="block-button"
                  onClick={() =>
                    handleBlockCustomer(
                      selectedCustomer.id
                    )
                  }
                >
                  <FaBan /> Block Customer
                </button>
              )}
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-box">
              <FaPhone />
              <div>
                <span>Phone Number</span>
                <strong>
                  {selectedCustomer.phone}
                </strong>
              </div>
            </div>

            <div className="detail-box">
              <FaEnvelope />
              <div>
                <span>Email Address</span>
                <strong>
                  {selectedCustomer.email}
                </strong>
              </div>
            </div>

            <div className="detail-box">
              <FaMapMarkerAlt />
              <div>
                <span>City</span>
                <strong>
                  {selectedCustomer.city}
                </strong>
              </div>
            </div>

            <div className="detail-box">
              {getSourceIcon(selectedCustomer.source)}
              <div>
                <span>Customer Source</span>
                <strong>
                  {selectedCustomer.source}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomers = () => {
    return (
      <div className="customers-content">
        <div className="section-header">
          <div>
            <h2>All Customers</h2>
            <p>
              Manage and view all your customers.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              setShowAddCustomer(true)
            }
          >
            <FaPlus /> Add Customer
          </button>
        </div>

        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon purple">
              <FaUsers />
            </div>

            <div>
              <span>Total Customers</span>
              <strong>{totalCustomers}</strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon green">
              <FaUserCheck />
            </div>

            <div>
              <span>Active Customers</span>
              <strong>{activeCustomers}</strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon orange">
              <FaUserTimes />
            </div>

            <div>
              <span>Inactive Customers</span>
              <strong>{inactiveCustomers}</strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon red">
              <FaUserSlash />
            </div>

            <div>
              <span>Blocked Customers</span>
              <strong>{blockedCustomers}</strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon blue">
              <FaLayerGroup />
            </div>

            <div>
              <span>Customer Groups</span>
              <strong>{groups.length}</strong>
            </div>
          </div>
        </div>

        <div className="filter-card">
          <div className="search-box">
            <FaSearch />

            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />
          </div>

          <div className="filter-box">
            <FaFilter />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
        </div>

        {renderCustomerTable(filteredCustomers)}
      </div>
    );
  };

  const renderGroups = () => {
    return (
      <div className="groups-content">
        <div className="section-header">
          <div>
            <h2>Customer Groups</h2>
            <p>
              Organize customers into internal lists
              based on common interests or
              requirements.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              setShowCreateGroup(true)
            }
          >
            <FaPlus /> Create Group
          </button>
        </div>

        <div className="groups-grid">
          {groups.map((group) => (
            <div
              className="group-card"
              key={group.id}
            >
              <div className="group-icon">
                <FaLayerGroup />
              </div>

              <h3>{group.name}</h3>
              <p>{group.description}</p>

              <div className="group-members">
                <FaUsers />
                {group.members.length} Members
              </div>

              <div className="group-actions">
                <button
                  onClick={() =>
                    handleViewGroup(group)
                  }
                >
                  <FaEye /> View Group
                </button>

                <button
                  onClick={() =>
                    handleManageMembers(group)
                  }
                >
                  <FaUserPlus /> Manage Members
                </button>

                <button
                  className="delete-group"
                  onClick={() =>
                    handleDeleteGroup(group.id)
                  }
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderImportExport = () => {
    return (
      <div className="import-export-content">
        <div className="section-header">
          <div>
            <h2>Import / Export</h2>
            <p>
              Import customer data or export your
              current customers.
            </p>
          </div>
        </div>

        <div className="import-export-grid">
          <div className="import-card">
            <div className="large-feature-icon">
              <FaUpload />
            </div>

            <h3>Import Customers</h3>
            <p>
              Upload a CSV file containing your
              customer information.
            </p>

            <label className="upload-button">
              <FaUpload /> Choose CSV File

              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
              />
            </label>
          </div>

          <div className="import-card">
            <div className="large-feature-icon export">
              <FaDownload />
            </div>

            <h3>Export Customers</h3>
            <p>
              Download all customer information as a
              CSV file.
            </p>

            <button
              className="primary-button"
              onClick={handleExport}
            >
              <FaDownload /> Export CSV
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBlockedCustomers = () => {
    const blocked = customers.filter(
      (customer) => customer.status === "Blocked"
    );

    return (
      <div className="blocked-content">
        <div className="section-header">
          <div>
            <h2>Blocked Customers</h2>
            <p>
              View and manage customers who have been
              blocked.
            </p>
          </div>
        </div>

        {blocked.length > 0 ? (
          <div className="blocked-list">
            {blocked.map((customer) => (
              <div
                className="blocked-card"
                key={customer.id}
              >
                <div className="blocked-avatar">
                  {customer.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="blocked-info">
                  <h3>{customer.name}</h3>
                  <p>{customer.phone}</p>

                  <span>
                    <FaMapMarkerAlt />{" "}
                    {customer.city}
                  </span>
                </div>

                <div className="blocked-actions">
                  <button
                    className="view-button"
                    onClick={() =>
                      handleViewCustomer(customer)
                    }
                  >
                    <FaEye /> View
                  </button>

                  <button
                    className="unblock-button"
                    onClick={() =>
                      handleUnblockCustomer(
                        customer.id
                      )
                    }
                  >
                    <FaUnlock /> Unblock
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state blocked-empty">
            <FaCheckCircle />
            <h3>No Blocked Customers</h3>
            <p>
              There are currently no blocked
              customers.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderMainContent = () => {
    if (selectedCustomer) {
      return renderCustomerProfile();
    }

    if (selectedGroupId) {
      return renderGroupDetails();
    }

    if (managingGroupId) {
      return renderManageMembers();
    }

    if (activeSection === "customers") {
      return renderCustomers();
    }

    if (activeSection === "groups") {
      return renderGroups();
    }

    if (activeSection === "import-export") {
      return renderImportExport();
    }

    if (activeSection === "blocked") {
      return renderBlockedCustomers();
    }

    return renderCustomers();
  };

  return (
    <div className="customers-page">
      <aside className="customers-sidebar">
        <div className="sidebar-title">
          <div className="sidebar-logo">
            <FaUsers />
          </div>

          <div>
            <h2>Customers</h2>
            <span>WhatsApp Management</span>
          </div>
        </div>

        <div className="sidebar-menu">
          <button
            className={
              activeSection === "customers"
                ? "sidebar-item active"
                : "sidebar-item"
            }
            onClick={() => {
              setActiveSection("customers");
              setSelectedCustomer(null);
            }}
          >
            <FaUsers />
            <span>All Customers</span>
          </button>

          <button
            className={
              activeSection === "groups"
                ? "sidebar-item active"
                : "sidebar-item"
            }
            onClick={() => {
              setActiveSection("groups");
              setSelectedCustomer(null);
            }}
          >
            <FaLayerGroup />
            <span>Customer Groups</span>
          </button>

          <button
            className={
              activeSection === "import-export"
                ? "sidebar-item active"
                : "sidebar-item"
            }
            onClick={() => {
              setActiveSection("import-export");
              setSelectedCustomer(null);
            }}
          >
            <FaUpload />
            <span>Import / Export</span>
          </button>

          <button
            className={
              activeSection === "blocked"
                ? "sidebar-item active"
                : "sidebar-item"
            }
            onClick={() => {
              setActiveSection("blocked");
              setSelectedCustomer(null);
            }}
          >
            <FaUserSlash />
            <span>Blocked Customers</span>
          </button>
        </div>
      </aside>

      <main className="customers-main">
        {renderMainContent()}
      </main>

      {showAddCustomer && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Add Customer</h2>
                <p>
                  Add a new customer to your list.
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowAddCustomer(false)
                }
              >
                <FaTimes />
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Name</label>

                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      name: e.target.value
                    })
                  }
                  placeholder="Enter customer name"
                />
              </div>

              <div className="form-group">
                <label>Phone</label>

                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      phone: e.target.value
                    })
                  }
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label>Email</label>

                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      email: e.target.value
                    })
                  }
                  placeholder="Enter email"
                />
              </div>

              <div className="form-group">
                <label>City</label>

                <input
                  type="text"
                  value={newCustomer.city}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      city: e.target.value
                    })
                  }
                  placeholder="Enter city"
                />
              </div>

              <div className="form-group">
                <label>Source</label>

                <select
                  value={newCustomer.source}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      source: e.target.value
                    })
                  }
                >
                  <option>WhatsApp</option>
                  <option>Website</option>
                  <option>Facebook</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>

                <select
                  value={newCustomer.status}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      status: e.target.value
                    })
                  }
                >
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Blocked</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() =>
                  setShowAddCustomer(false)
                }
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={handleAddCustomer}
              >
                <FaPlus /> Add Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateGroup && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Create Customer Group</h2>
                <p>
                  Create an internal customer
                  organization list.
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowCreateGroup(false)
                }
              >
                <FaTimes />
              </button>
            </div>

            <div className="form-group">
              <label>Group Name</label>

              <input
                type="text"
                value={newGroup.name}
                onChange={(e) =>
                  setNewGroup({
                    ...newGroup,
                    name: e.target.value
                  })
                }
                placeholder="Example: Product A Interested Customers"
              />
            </div>

            <div className="form-group">
              <label>Description</label>

              <textarea
                value={newGroup.description}
                onChange={(e) =>
                  setNewGroup({
                    ...newGroup,
                    description: e.target.value
                  })
                }
                placeholder="Enter group description"
              />
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() =>
                  setShowCreateGroup(false)
                }
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={handleCreateGroup}
              >
                <FaPlus /> Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }

        .customers-page {
          min-height: 100vh;
          display: flex;
          background: #f7f8fc;
          color: #25243a;
          font-family: Arial, Helvetica, sans-serif;
        }

        .customers-sidebar {
          width: 245px;
          min-height: 100vh;
          background: #ffffff;
          border-right: 1px solid #e8e6f1;
          padding: 22px 14px;
          position: sticky;
          top: 0;
          align-self: flex-start;
        }

        .sidebar-title {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 5px 8px 25px;
          border-bottom: 1px solid #eeeeF5;
          margin-bottom: 20px;
        }

        .sidebar-logo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #eee9ff;
          color: #6845d7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
        }

        .sidebar-title h2 {
          margin: 0;
          font-size: 17px;
          color: #2c2941;
        }

        .sidebar-title span {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          color: #8d899f;
        }

        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sidebar-item {
          width: 100%;
          border: 0;
          background: transparent;
          color: #68647a;
          padding: 13px 12px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          text-align: left;
          font-size: 14px;
          transition: 0.2s;
        }

        .sidebar-item svg {
          width: 17px;
        }

        .sidebar-item:hover {
          background: #f5f2ff;
          color: #6845d7;
        }

        .sidebar-item.active {
          background: #eee9ff;
          color: #6845d7;
          font-weight: 600;
        }

        .customers-main {
          flex: 1;
          padding: 30px;
          min-width: 0;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .section-header h2 {
          margin: 0;
          font-size: 25px;
          color: #29263d;
        }

        .section-header p {
          margin: 7px 0 0;
          color: #858197;
          font-size: 13px;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .primary-button,
        .secondary-button {
          border: 0;
          border-radius: 9px;
          padding: 11px 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .primary-button {
          background: #6845d7;
          color: white;
        }

        .primary-button:hover {
          background: #5937c5;
        }

        .secondary-button {
          background: #eeeaff;
          color: #6845d7;
        }

        .secondary-button:hover {
          background: #e2dcff;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 15px;
          margin-bottom: 22px;
        }

        .summary-card {
          background: white;
          border: 1px solid #ebe9f2;
          border-radius: 13px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 13px;
          box-shadow: 0 3px 12px rgba(49, 42, 85, 0.03);
        }

        .summary-icon {
          width: 43px;
          height: 43px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-icon.purple {
          background: #eee9ff;
          color: #6845d7;
        }

        .summary-icon.green {
          background: #e8f8ef;
          color: #28a866;
        }

        .summary-icon.orange {
          background: #fff3e4;
          color: #e99a37;
        }

        .summary-icon.red {
          background: #ffebec;
          color: #e45d67;
        }

        .summary-icon.blue {
          background: #e8f3ff;
          color: #4b91dc;
        }

        .summary-card span {
          display: block;
          font-size: 11px;
          color: #858197;
          margin-bottom: 5px;
        }

        .summary-card strong {
          font-size: 22px;
          color: #29263d;
        }

        .filter-card {
          background: white;
          border: 1px solid #ebe9f2;
          border-radius: 12px;
          padding: 14px;
          display: flex;
          gap: 12px;
          margin-bottom: 18px;
        }

        .search-box {
          flex: 1;
          height: 42px;
          border: 1px solid #e5e2ee;
          border-radius: 8px;
          display: flex;
          align-items: center;
          padding: 0 13px;
          gap: 9px;
          color: #9b97a9;
        }

        .search-box input {
          width: 100%;
          border: 0;
          outline: 0;
          font-size: 13px;
          color: #353247;
        }

        .filter-box {
          width: 180px;
          height: 42px;
          border: 1px solid #e5e2ee;
          border-radius: 8px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          gap: 9px;
          color: #8c889a;
        }

        .filter-box select {
          width: 100%;
          border: 0;
          outline: 0;
          background: white;
          color: #4a465b;
          font-size: 13px;
        }

        .customer-table-wrapper {
          background: white;
          border: 1px solid #ebe9f2;
          border-radius: 13px;
          overflow-x: auto;
          box-shadow: 0 3px 12px rgba(49, 42, 85, 0.03);
        }

        .customer-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
        }

        .customer-table th {
          text-align: left;
          padding: 14px 15px;
          background: #faf9fd;
          color: #777287;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border-bottom: 1px solid #eeeef4;
        }

        .customer-table td {
          padding: 15px;
          border-bottom: 1px solid #f0eef5;
          vertical-align: middle;
          font-size: 12px;
        }

        .customer-table tbody tr:hover {
          background: #fcfbff;
        }

        .customer-name-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .customer-avatar,
        .large-avatar {
          background: #eee9ff;
          color: #6845d7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .customer-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
        }

        .customer-name-cell strong {
          display: block;
          color: #333047;
          font-size: 13px;
        }

        .customer-name-cell span {
          display: block;
          color: #9995a7;
          margin-top: 4px;
          font-size: 10px;
        }

        .contact-cell {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #777387;
        }

        .contact-cell span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .contact-cell svg {
          color: #9c96ad;
          font-size: 10px;
        }

        .location-cell,
        .source-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6e6a7d;
        }

        .location-cell svg {
          color: #e48b91;
        }

        .source-cell svg {
          color: #6845d7;
        }

        .status-badge {
          display: inline-flex;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
        }

        .status-active {
          background: #e8f8ef;
          color: #21985b;
        }

        .status-inactive {
          background: #fff3e4;
          color: #d78725;
        }

        .status-blocked {
          background: #ffebec;
          color: #d94f59;
        }

        .view-button,
        .unblock-button,
        .block-button {
          border: 0;
          border-radius: 7px;
          padding: 8px 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
        }

        .view-button {
          background: #eee9ff;
          color: #6845d7;
        }

        .delete-button {
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 18px;
        }

        .delete-button:hover {
          transform: scale(1.15);
          opacity: 0.8;
        }

        .unblock-button {
          background: #e8f8ef;
          color: #23975b;
        }

        .block-button {
          background: #ffebec;
          color: #d6535c;
        }

        .empty-state {
          min-height: 220px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #9b97a8;
          text-align: center;
        }

        .empty-state svg {
          font-size: 30px;
          color: #c2badf;
          margin-bottom: 10px;
        }

        .empty-state h3 {
          margin: 0 0 5px;
          color: #4b475c;
        }

        .empty-state p {
          margin: 0;
          font-size: 12px;
        }

        .profile-page {
          max-width: 1200px;
        }

        .back-button {
          border: 0;
          background: transparent;
          color: #6845d7;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0;
          margin-bottom: 18px;
          font-size: 13px;
          font-weight: 600;
        }

        .profile-card {
          background: white;
          border: 1px solid #ebe9f2;
          border-radius: 14px;
          padding: 25px;
        }

        .profile-top {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 23px;
          border-bottom: 1px solid #eeeef4;
        }

        .large-avatar {
          width: 75px;
          height: 75px;
          border-radius: 18px;
          font-size: 28px;
        }

        .profile-main {
          flex: 1;
        }

        .profile-main h2 {
          margin: 0 0 8px;
          color: #2c2940;
          font-size: 23px;
        }

        .profile-main p {
          margin: 8px 0 0;
          color: #9691a4;
          font-size: 11px;
        }

        .profile-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .profile-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 22px;
        }

        .detail-box {
          background: #faf9fd;
          border: 1px solid #efedf5;
          border-radius: 10px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .detail-box > svg {
          color: #6845d7;
        }

        .detail-box span {
          display: block;
          color: #9590a2;
          font-size: 10px;
          margin-bottom: 5px;
        }

        .detail-box strong {
          color: #403c51;
          font-size: 13px;
        }

        .group-details-page,
        .manage-members-page {
          max-width: 1200px;
        }

        .group-detail-header,
        .manage-members-header {
          background: white;
          border: 1px solid #ebe9f2;
          border-radius: 13px;
          padding: 22px;
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .group-detail-icon {
          width: 58px;
          height: 58px;
          border-radius: 14px;
          background: #e8f3ff;
          color: #4d8dce;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
        }

        .group-detail-heading {
          flex: 1;
        }

        .group-detail-heading h2,
        .manage-members-header h2 {
          margin: 0;
          color: #302c42;
          font-size: 22px;
        }

        .group-detail-heading p,
        .manage-members-header p {
          margin: 6px 0 0;
          color: #777287;
          font-size: 12px;
        }

        .group-detail-count,
        .selected-member-count {
          min-width: 110px;
          background: #f3f0ff;
          color: #6845d7;
          border-radius: 11px;
          padding: 11px 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex-wrap: wrap;
          text-align: center;
        }

        .group-detail-count strong,
        .selected-member-count strong {
          font-size: 18px;
        }

        .group-detail-count span,
        .selected-member-count span {
          width: 100%;
          font-size: 10px;
          color: #817a99;
        }

        .group-detail-card,
        .manage-members-card {
          background: white;
          border: 1px solid #ebe9f2;
          border-radius: 13px;
          padding: 22px;
        }

        .group-detail-section-header,
        .manage-members-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
        }

        .group-detail-section-header h3,
        .manage-members-top h3 {
          margin: 0;
          color: #3b374d;
          font-size: 16px;
        }

        .group-detail-section-header p,
        .manage-members-top p {
          margin: 5px 0 0;
          color: #9691a2;
          font-size: 11px;
        }

        .group-member-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .group-member-row {
          border: 1px solid #eeeef4;
          border-radius: 10px;
          padding: 13px;
          display: grid;
          grid-template-columns: 1.3fr 1.5fr 1fr auto auto;
          align-items: center;
          gap: 14px;
        }

        .group-member-row:hover {
          background: #fcfbff;
        }

        .group-member-contact {
          display: flex;
          flex-direction: column;
          gap: 5px;
          color: #777387;
          font-size: 11px;
        }

        .group-member-contact span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .group-empty {
          border: 1px solid #eeeef4;
          border-radius: 10px;
        }

        .manage-members-header > div:first-child {
          flex: 1;
        }

        .manage-members-header span {
          display: block;
          margin-top: 5px;
          color: #9a95a6;
          font-size: 11px;
        }

        .member-selection-actions {
          display: flex;
          gap: 8px;
        }

        .member-checkbox-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .member-checkbox-row {
          border: 1px solid #e8e5ef;
          border-radius: 10px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          background: #fcfbff;
        }

        .member-checkbox-row:hover {
          border-color: #cfc5f7;
          background: #f8f6ff;
        }

        .member-checkbox-row input {
          width: 17px;
          height: 17px;
          accent-color: #6845d7;
          cursor: pointer;
        }

        .member-checkbox-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .member-checkbox-info strong {
          color: #39354b;
          font-size: 13px;
        }

        .member-checkbox-info span {
          color: #777287;
          font-size: 11px;
        }

        .member-checkbox-info small {
          color: #9b97a8;
          font-size: 10px;
        }

        .member-checkbox-location {
          min-width: 110px;
          display: flex;
          align-items: center;
          gap: 5px;
          color: #777287;
          font-size: 11px;
        }

        .member-checkbox-location svg {
          color: #e48b91;
        }

        .manage-members-footer {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 18px;
          padding-top: 17px;
          border-top: 1px solid #eeeef4;
        }

        .groups-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }

        .group-card {
          background: white;
          border: 1px solid #ebe9f2;
          border-radius: 13px;
          padding: 20px;
        }

        .group-icon {
          width: 44px;
          height: 44px;
          border-radius: 11px;
          background: #e8f3ff;
          color: #4d8dce;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .group-card h3 {
          margin: 14px 0 6px;
          font-size: 16px;
          color: #373348;
        }

        .group-card > p {
          margin: 0;
          color: #8f8a9d;
          font-size: 12px;
          line-height: 1.5;
        }

        .group-members {
          margin-top: 15px;
          display: flex;
          align-items: center;
          gap: 7px;
          color: #6845d7;
          font-size: 11px;
        }

        .group-actions {
          display: flex;
          gap: 8px;
          margin-top: 17px;
        }

        .group-actions button {
          border: 0;
          background: #f3f0ff;
          color: #6845d7;
          padding: 8px 10px;
          border-radius: 7px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
        }

        .group-actions .delete-group {
          background: #fff0f1;
          color: #d95a63;
          margin-left: auto;
        }

        .import-export-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .import-card {
          background: white;
          border: 1px solid #ebe9f2;
          border-radius: 13px;
          padding: 30px;
          text-align: center;
        }

        .large-feature-icon {
          width: 62px;
          height: 62px;
          margin: 0 auto 15px;
          border-radius: 16px;
          background: #eee9ff;
          color: #6845d7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
        }

        .large-feature-icon.export {
          background: #e8f8ef;
          color: #26985b;
        }

        .import-card h3 {
          margin: 0 0 8px;
          color: #39354b;
          font-size: 17px;
        }

        .import-card p {
          color: #9691a2;
          font-size: 12px;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .upload-button {
          background: #6845d7;
          color: white;
          padding: 11px 16px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .upload-button input {
          display: none;
        }

        .blocked-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .blocked-card {
          background: white;
          border: 1px solid #ebe9f2;
          border-radius: 12px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .blocked-avatar {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          background: #ffebec;
          color: #d95a63;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .blocked-info {
          flex: 1;
        }

        .blocked-info h3 {
          margin: 0 0 5px;
          color: #3a364a;
          font-size: 14px;
        }

        .blocked-info p {
          margin: 0 0 4px;
          color: #777284;
          font-size: 11px;
        }

        .blocked-info span {
          color: #9a95a6;
          font-size: 10px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .blocked-actions {
          display: flex;
          gap: 8px;
        }

        .blocked-empty {
          background: white;
          border: 1px solid #ebe9f2;
          border-radius: 13px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(37, 32, 58, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }

        .modal {
          width: 100%;
          max-width: 650px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 15px;
          padding: 23px;
          box-shadow: 0 15px 45px rgba(38, 30, 67, 0.18);
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          margin: 0;
          color: #302c42;
          font-size: 20px;
        }

        .modal-header p {
          margin: 5px 0 0;
          color: #9691a2;
          font-size: 11px;
        }

        .close-button {
          border: 0;
          background: #f3f1f7;
          color: #777286;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 7px;
          color: #555064;
          font-size: 11px;
          font-weight: 600;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          border: 1px solid #dfdce8;
          border-radius: 8px;
          outline: none;
          padding: 10px 11px;
          color: #444054;
          font-size: 12px;
          background: white;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #a89be0;
        }

        .form-group textarea {
          min-height: 90px;
          resize: vertical;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 18px;
          padding-top: 17px;
          border-top: 1px solid #eeeef4;
        }

        .cancel-button {
          border: 1px solid #dedbe7;
          background: white;
          color: #686376;
          border-radius: 8px;
          padding: 10px 15px;
          cursor: pointer;
          font-size: 12px;
        }

        @media (max-width: 1200px) {
          .summary-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 850px) {
          .customers-sidebar {
            width: 200px;
          }

          .customers-main {
            padding: 20px;
          }

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .groups-grid,
          .import-export-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .customers-page {
            display: block;
          }

          .customers-sidebar {
            width: 100%;
            min-height: auto;
            position: relative;
          }

          .sidebar-menu {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
          }

          .section-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .summary-grid,
          .profile-details,
          .form-grid {
            grid-template-columns: 1fr;
          }

          .filter-card {
            flex-direction: column;
          }

          .filter-box {
            width: 100%;
          }

          .profile-top {
            flex-direction: column;
            align-items: flex-start;
          }

          .profile-actions {
            flex-wrap: wrap;
          }

          .blocked-card {
            align-items: flex-start;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}