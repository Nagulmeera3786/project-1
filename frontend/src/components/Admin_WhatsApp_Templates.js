import React, { useEffect, useState } from 'react';

const initialTemplates = [
  {
    id: 1,
    name: 'Welcome Message',
    category: 'Greeting',
    status: 'Approved',
    text: 'Hi {{first_name}}, welcome to Bhima! We are happy to help you with our WhatsApp messaging needs.',
    users: ['Rahul Sharma', 'Priya Reddy', 'Arjun Kumar'],
  },
  {
    id: 2,
    name: 'Product Follow-up',
    category: 'Sales',
    status: 'Approved',
    text: 'Hello {{first_name}}, we hope you are doing well. Would you like a quick demo of our product?',
    users: ['Sneha Reddy', 'Kiran Kumar'],
  },
  {
    id: 3,
    name: 'Appointment Reminder',
    category: 'Support',
    status: 'Pending',
    text: 'Hi {{first_name}}, this is a reminder for your scheduled appointment tomorrow at 10:00 AM.',
    users: ['Anil Kumar', 'Divya Sharma'],
  },
];

const STORAGE_KEY = 'whatsapp_templates';

const Templates = () => {
  const [templates, setTemplates] = useState(() => {
    try {
      const savedTemplates = localStorage.getItem(STORAGE_KEY);

      if (savedTemplates) {
        const parsedTemplates = JSON.parse(savedTemplates);

        if (Array.isArray(parsedTemplates)) {
          return parsedTemplates;
        }
      }
    } catch (error) {
      console.error('Unable to load templates:', error);
    }

    return initialTemplates;
  });

  const [activeOption, setActiveOption] = useState('All Templates');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showUsers, setShowUsers] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: '',
    text: '',
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Unable to save templates:', error);
    }
  }, [templates]);

  const handleNewTemplateChange = (e) => {
    const { name, value } = e.target;

    setNewTemplate((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateTemplate = () => {
    if (
      !newTemplate.name.trim() ||
      !newTemplate.category.trim() ||
      !newTemplate.text.trim()
    ) {
      alert('Please fill all the fields.');
      return;
    }

    const templateToAdd = {
      id: Date.now(),
      name: newTemplate.name.trim(),
      category: newTemplate.category,
      status: 'Pending',
      text: newTemplate.text.trim(),
      users: [],
    };

    setTemplates((prev) => [...prev, templateToAdd]);

    setNewTemplate({
      name: '',
      category: '',
      text: '',
    });

    setShowNewTemplate(false);
    setActiveOption('All Templates');
  };

  const getFilteredTemplates = () => {
    if (activeOption === 'All Templates') {
      return templates;
    }

    if (activeOption === 'Approved Templates') {
      return templates.filter(
        (template) => template.status === 'Approved'
      );
    }

    if (activeOption === 'Rejected Templates') {
      return templates.filter(
        (template) => template.status === 'Rejected'
      );
    }

    if (activeOption === 'Pending Templates') {
      return templates.filter(
        (template) => template.status === 'Pending'
      );
    }

    return templates;
  };

  const filteredTemplates = getFilteredTemplates();

  return (
    <div
      style={{
        padding: '32px',
        background: '#f5f7fb',
        minHeight: '100vh',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '32px',
                color: '#111827',
              }}
            >
              Templates
            </h1>
          </div>

          <button
            onClick={() => setShowNewTemplate(true)}
            style={{
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 18px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(16, 185, 129, 0.2)',
            }}
          >
            + New Template
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '24px',
          }}
        >
          {[
            'All Templates',
            'Users & Templates',
            'Approved Templates',
            'Rejected Templates',
            'Pending Templates',
          ].map((option) => (
            <button
              key={option}
              onClick={() => setActiveOption(option)}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background:
                  activeOption === option ? '#10b981' : '#ffffff',
                color:
                  activeOption === option ? '#ffffff' : '#374151',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {option}
            </button>
          ))}
        </div>

        {activeOption === 'Users & Templates' ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
              border: '1px solid #edf2f7',
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: '20px',
                color: '#111827',
              }}
            >
              Users & Templates
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '12px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                        fontSize: '13px',
                      }}
                    >
                      CUSTOMER NAME
                    </th>

                    <th
                      style={{
                        textAlign: 'left',
                        padding: '12px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                        fontSize: '13px',
                      }}
                    >
                      TEMPLATE NAME
                    </th>

                    <th
                      style={{
                        textAlign: 'left',
                        padding: '12px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                        fontSize: '13px',
                      }}
                    >
                      CATEGORY
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {templates.flatMap((template) =>
                    template.users.map((user, index) => (
                      <tr key={`${template.id}-${index}`}>
                        <td
                          style={{
                            padding: '14px 12px',
                            borderBottom: '1px solid #f1f5f9',
                            color: '#374151',
                          }}
                        >
                          {user}
                        </td>

                        <td
                          style={{
                            padding: '14px 12px',
                            borderBottom: '1px solid #f1f5f9',
                            color: '#374151',
                            fontWeight: 600,
                          }}
                        >
                          {template.name}
                        </td>

                        <td
                          style={{
                            padding: '14px 12px',
                            borderBottom: '1px solid #f1f5f9',
                            color: '#6b7280',
                          }}
                        >
                          {template.category}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {templates.every((template) => template.users.length === 0) && (
                <div
                  style={{
                    padding: '30px',
                    textAlign: 'center',
                    color: '#6b7280',
                  }}
                >
                  No users assigned to templates yet.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px',
            }}
          >
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow:
                      '0 8px 20px rgba(15, 23, 42, 0.06)',
                    border: '1px solid #edf2f7',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                      gap: '10px',
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        color: '#111827',
                        fontSize: '20px',
                      }}
                    >
                      {template.name}
                    </h3>

                    <span
                      style={{
                        background:
                          template.status === 'Approved'
                            ? '#dffdf4'
                            : template.status === 'Rejected'
                            ? '#fee2e2'
                            : '#fef3c7',
                        color:
                          template.status === 'Approved'
                            ? '#047857'
                            : template.status === 'Rejected'
                            ? '#b91c1c'
                            : '#b45309',
                        borderRadius: '999px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {template.status}
                    </span>
                  </div>

                  <div
                    style={{
                      marginBottom: '12px',
                      color: '#6b7280',
                      fontSize: '13px',
                    }}
                  >
                    <strong>Category:</strong> {template.category}
                  </div>

                  <div
                    style={{
                      background: '#f9fafb',
                      borderRadius: '10px',
                      padding: '14px',
                      color: '#374151',
                      lineHeight: 1.6,
                      border: '1px solid #edf2f7',
                      minHeight: '110px',
                    }}
                  >
                    {template.text}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: '16px',
                    }}
                  >
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowUsers(true);
                      }}
                      style={{
                        border: 'none',
                        background: '#eff6ff',
                        color: '#2563eb',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Users
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  gridColumn: '1 / -1',
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '40px',
                  textAlign: 'center',
                  color: '#6b7280',
                  border: '1px solid #edf2f7',
                }}
              >
                No templates found.
              </div>
            )}
          </div>
        )}

        {showNewTemplate && (
          <div
            onClick={() => setShowNewTemplate(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                width: '100%',
                maxWidth: '520px',
                borderRadius: '16px',
                padding: '24px',
                boxShadow:
                  '0 20px 50px rgba(15, 23, 42, 0.15)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: '#111827',
                  }}
                >
                  New Template
                </h2>

                <button
                  onClick={() => setShowNewTemplate(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '22px',
                    color: '#6b7280',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>

              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#374151',
                  fontWeight: 600,
                }}
              >
                Template Name
              </label>

              <input
                type="text"
                name="name"
                value={newTemplate.name}
                onChange={handleNewTemplateChange}
                placeholder="Enter template name"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  outline: 'none',
                  fontSize: '14px',
                }}
              />

              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#374151',
                  fontWeight: 600,
                }}
              >
                Category
              </label>

              <select
                name="category"
                value={newTemplate.category}
                onChange={handleNewTemplateChange}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  outline: 'none',
                  fontSize: '14px',
                  background: '#ffffff',
                }}
              >
                <option value="">Select Category</option>
                <option value="Greeting">Greeting</option>
                <option value="Sales">Sales</option>
                <option value="Support">Support</option>
              </select>

              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#374151',
                  fontWeight: 600,
                }}
              >
                Message
              </label>

              <textarea
                name="text"
                value={newTemplate.text}
                onChange={handleNewTemplateChange}
                placeholder="Enter your template message"
                rows="5"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  outline: 'none',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'Inter, Arial, sans-serif',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                <button
                  onClick={() => setShowNewTemplate(false)}
                  style={{
                    padding: '11px 18px',
                    border: '1px solid #d1d5db',
                    background: '#ffffff',
                    color: '#374151',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleCreateTemplate}
                  style={{
                    padding: '11px 18px',
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Create Template
                </button>
              </div>
            </div>
          </div>
        )}

        {showUsers && selectedTemplate && (
          <div
            onClick={() => setShowUsers(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                width: '100%',
                maxWidth: '450px',
                borderRadius: '16px',
                padding: '24px',
                boxShadow:
                  '0 20px 50px rgba(15, 23, 42, 0.15)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: '#111827',
                  }}
                >
                  {selectedTemplate.name}
                </h2>

                <button
                  onClick={() => setShowUsers(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '22px',
                    color: '#6b7280',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>

              {selectedTemplate.users.length > 0 ? (
                selectedTemplate.users.map((user, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '12px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      color: '#374151',
                    }}
                  >
                    {user}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: '15px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    color: '#6b7280',
                  }}
                >
                  No users assigned yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;