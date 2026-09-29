import React, { useState, useEffect, useRef } from "react";
import {
  FaRegClock,
  FaHistory,
  FaFilter,
  FaSearch,
  FaPlus,
  FaChevronRight,
  FaChevronDown,
  FaWhatsapp,
} from "react-icons/fa";

function Inbox() {
  const [activeMenu, setActiveMenu] = useState("");
  const [activeFilterOption, setActiveFilterOption] = useState("");
  const [activeNewOption, setActiveNewOption] = useState("");

  const [filterSelected, setFilterSelected] = useState({
    channel: false,
    chatType: false,
    labels: false,
    countries: false,
  });

  const [filterSubSelected, setFilterSubSelected] = useState({
    whatsapp: false,
    open: false,
    closed: false,
    replied: false,
    unreplied: false,
    blocked: false,
    important: false,
    customer: false,
    lead: false,
    india: false,
    usa: false,
    uk: false,
  });

  const [newSelected, setNewSelected] = useState({
    channelName: false,
    templateName: false,
  });

  const [newSubSelected, setNewSubSelected] = useState({
    whatsapp: false,
    template1: false,
    template2: false,
  });

  const openPanelRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        openPanelRef.current &&
        !openPanelRef.current.contains(event.target)
      ) {
        setActiveMenu("");
        setActiveFilterOption("");
        setActiveNewOption("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleMainMenuClick = (menu) => {
    if (activeMenu === menu) {
      setActiveMenu("");
      setActiveFilterOption("");
      setActiveNewOption("");
    } else {
      setActiveMenu(menu);
      setActiveFilterOption("");
      setActiveNewOption("");
    }
  };

  const handleFilterOptionClick = (option, event) => {
    event.stopPropagation();

    setFilterSelected((previous) => ({
      ...previous,
      [option]: !previous[option],
    }));
  };

  const handleFilterArrowClick = (option, event) => {
    event.stopPropagation();

    if (activeFilterOption === option) {
      setActiveFilterOption("");
    } else {
      setActiveFilterOption(option);
    }
  };

  const handleFilterSubOptionClick = (option, event) => {
    event.stopPropagation();

    setFilterSubSelected((previous) => ({
      ...previous,
      [option]: !previous[option],
    }));
  };

  const handleNewOptionClick = (option, event) => {
    event.stopPropagation();

    setNewSelected((previous) => ({
      ...previous,
      [option]: !previous[option],
    }));
  };

  const handleNewArrowClick = (option, event) => {
    event.stopPropagation();

    if (activeNewOption === option) {
      setActiveNewOption("");
    } else {
      setActiveNewOption(option);
    }
  };

  const handleNewSubOptionClick = (option, event) => {
    event.stopPropagation();

    setNewSubSelected((previous) => ({
      ...previous,
      [option]: !previous[option],
    }));
  };

  const Checkbox = ({ checked, onClick }) => (
    <span
      className={
        checked
          ? "inbox-checkbox checked"
          : "inbox-checkbox"
      }
      onClick={onClick}
    >
      {checked ? "✓" : ""}
    </span>
  );

  return (
    <>
      <style>
        {`
          * {
            box-sizing: border-box;
          }

          .inbox-page {
            width: 100%;
            min-height: 100vh;
            background: #ffffff;
            font-family: Arial, sans-serif;
            color: #1f2937;
          }

          .inbox-menu {
            display: flex;
            align-items: center;
            height: 74px;
            border-bottom: 1px solid #dfe3e8;
            padding-left: 5px;
          }

          .top-menu {
            height: 74px;
            min-width: 100px;
            padding: 8px 15px 6px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #737b84;
            border-bottom: 2px solid transparent;
            transition: 0.2s ease;
          }

          .top-menu:hover {
            background: #f7f9fb;
            color: #111827;
          }

          .top-menu.active {
            color: #111827;
            border-bottom: 2px solid #111827;
          }

          .top-icon {
            font-size: 22px;
            margin-bottom: 6px;
          }

          .top-text {
            font-size: 16px;
          }

          .inbox-content {
            position: relative;
            width: 100%;
            min-height: calc(100vh - 74px);
          }

          .inbox-checkbox {
            width: 28px;
            height: 28px;
            border: 1px solid #b9c3cd;
            border-radius: 4px;
            margin-right: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: #ffffff;
            color: #ffffff;
            font-size: 20px;
            font-weight: bold;
            line-height: 1;
            cursor: pointer;
          }

          .inbox-checkbox.checked {
            background: #55b947;
            border-color: #55b947;
          }

          .filter-container {
            position: absolute;
            top: 0;
            left: 204px;
            display: flex;
            z-index: 100;
            background: transparent;
          }

          .filter-panel {
            width: 375px;
            background: #ffffff;
            border: 1px solid #d5dbe1;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
          }

          .filter-row {
            min-height: 68px;
            padding: 0 18px 0 22px;
            display: flex;
            align-items: center;
            border-bottom: 1px solid #dfe3e8;
            cursor: pointer;
            background: #ffffff;
          }

          .filter-row:hover {
            background: #f3f6f8;
          }

          .filter-row.selected {
            background: #eef3f7;
          }

          .filter-label {
            flex: 1;
            font-size: 18px;
            cursor: pointer;
          }

          .row-arrow {
            width: 35px;
            height: 68px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #34495e;
            font-size: 16px;
            cursor: pointer;
          }

          .sub-panel {
            width: 305px;
            background: #ffffff;
            border-top: 1px solid #d5dbe1;
            border-right: 1px solid #d5dbe1;
            border-bottom: 1px solid #d5dbe1;
            box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.08);
          }

          .sub-row {
            min-height: 68px;
            padding: 0 20px;
            display: flex;
            align-items: center;
            border-bottom: 1px solid #dfe3e8;
            cursor: pointer;
            font-size: 17px;
            background: #ffffff;
          }

          .sub-row:hover {
            background: #f3f6f8;
          }

          .sub-row.selected {
            background: #eef3f7;
          }

          .sub-icon {
            font-size: 22px;
            margin-right: 12px;
          }

          .search-container {
            position: absolute;
            top: 0;
            left: 305px;
            width: 350px;
            background: #ffffff;
            border: 1px solid #d5dbe1;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
            z-index: 100;
          }

          .search-input {
            width: 100%;
            height: 58px;
            border: none;
            outline: none;
            padding: 0 18px;
            font-size: 16px;
          }

          .new-container {
            position: absolute;
            top: 0;
            left: 405px;
            display: flex;
            z-index: 100;
            background: transparent;
          }

          .new-panel {
            width: 300px;
            background: #ffffff;
            border: 1px solid #d5dbe1;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
          }

          .new-row {
            min-height: 68px;
            padding: 0 18px 0 22px;
            display: flex;
            align-items: center;
            border-bottom: 1px solid #dfe3e8;
            cursor: pointer;
            background: #ffffff;
          }

          .new-row:hover {
            background: #f3f6f8;
          }

          .new-row.selected {
            background: #eef3f7;
          }

          .new-label {
            flex: 1;
            font-size: 17px;
            cursor: pointer;
          }

          .new-arrow {
            width: 35px;
            height: 68px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #34495e;
            font-size: 16px;
            cursor: pointer;
          }

          .new-sub-panel {
            width: 260px;
            background: #ffffff;
            border-top: 1px solid #d5dbe1;
            border-right: 1px solid #d5dbe1;
            border-bottom: 1px solid #d5dbe1;
            box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.08);
          }

          @media (max-width: 900px) {
            .inbox-menu {
              overflow-x: auto;
            }

            .top-menu {
              min-width: 85px;
            }

            .filter-container {
              left: 5px;
            }

            .new-container {
              left: 5px;
            }
          }
        `}
      </style>

      <div className="inbox-page">

        <div className="inbox-menu">

          <div
            className={
              activeMenu === "live"
                ? "top-menu active"
                : "top-menu"
            }
            onClick={() => handleMainMenuClick("live")}
          >
            <FaRegClock className="top-icon" />
            <span className="top-text">Live</span>
          </div>

          <div
            className={
              activeMenu === "history"
                ? "top-menu active"
                : "top-menu"
            }
            onClick={() => handleMainMenuClick("history")}
          >
            <FaHistory className="top-icon" />
            <span className="top-text">History</span>
          </div>

          <div
            className={
              activeMenu === "filter"
                ? "top-menu active"
                : "top-menu"
            }
            onClick={() => handleMainMenuClick("filter")}
          >
            <FaFilter className="top-icon" />
            <span className="top-text">Filter</span>
          </div>

          <div
            className={
              activeMenu === "search"
                ? "top-menu active"
                : "top-menu"
            }
            onClick={() => handleMainMenuClick("search")}
          >
            <FaSearch className="top-icon" />
            <span className="top-text">Search</span>
          </div>

          <div
            className={
              activeMenu === "new"
                ? "top-menu active"
                : "top-menu"
            }
            onClick={() => handleMainMenuClick("new")}
          >
            <FaPlus className="top-icon" />
            <span className="top-text">New</span>
          </div>

        </div>

        <div className="inbox-content">

          {activeMenu === "filter" && (
            <div
              ref={openPanelRef}
              className="filter-container"
              onClick={(event) => event.stopPropagation()}
            >

              <div className="filter-panel">                 
                <div
                  className={
                    filterSelected.chatType
                      ? "filter-row selected"
                      : "filter-row"
                  }
                >
                  <Checkbox
                    checked={filterSelected.chatType}
                    onClick={(event) =>
                      handleFilterOptionClick("chatType", event)
                    }
                  />

                  <span
                    className="filter-label"
                    onClick={(event) =>
                      handleFilterOptionClick("chatType", event)
                    }
                  >
                    Chat Type
                  </span>

                  <span
                    className="row-arrow"
                    onClick={(event) =>
                      handleFilterArrowClick("chatType", event)
                    }
                  >
                    {activeFilterOption === "chatType" ? (
                      <FaChevronDown />
                    ) : (
                      <FaChevronRight />
                    )}
                  </span>
                </div>

                <div
                  className={
                    filterSelected.labels
                      ? "filter-row selected"
                      : "filter-row"
                  }
                >
                  <Checkbox
                    checked={filterSelected.labels}
                    onClick={(event) =>
                      handleFilterOptionClick("labels", event)
                    }
                  />

                  <span
                    className="filter-label"
                    onClick={(event) =>
                      handleFilterOptionClick("labels", event)
                    }
                  >
                    Labels
                  </span>

                  <span
                    className="row-arrow"
                    onClick={(event) =>
                      handleFilterArrowClick("labels", event)
                    }
                  >
                    {activeFilterOption === "labels" ? (
                      <FaChevronDown />
                    ) : (
                      <FaChevronRight />
                    )}
                  </span>
                </div>

                <div
                  className={
                    filterSelected.countries
                      ? "filter-row selected"
                      : "filter-row"
                  }
                >
                  <Checkbox
                    checked={filterSelected.countries}
                    onClick={(event) =>
                      handleFilterOptionClick("countries", event)
                    }
                  />

                  <span
                    className="filter-label"
                    onClick={(event) =>
                      handleFilterOptionClick("countries", event)
                    }
                  >
                    Countries
                  </span>

                  <span
                    className="row-arrow"
                    onClick={(event) =>
                      handleFilterArrowClick("countries", event)
                    }
                  >
                    {activeFilterOption === "countries" ? (
                      <FaChevronDown />
                    ) : (
                      <FaChevronRight />
                    )}
                  </span>
                </div>

              </div>
              {activeFilterOption === "chatType" && (
                <div className="sub-panel">

                  <div
                    className={
                      filterSubSelected.open
                        ? "sub-row selected"
                        : "sub-row"
                    }
                    onClick={(event) =>
                      handleFilterSubOptionClick("open", event)
                    }
                  >
                    <Checkbox
                      checked={filterSubSelected.open}
                      onClick={(event) =>
                        handleFilterSubOptionClick("open", event)
                      }
                    />
                    <span>Open</span>
                  </div>

                  <div
                    className={
                      filterSubSelected.closed
                        ? "sub-row selected"
                        : "sub-row"
                    }
                    onClick={(event) =>
                      handleFilterSubOptionClick("closed", event)
                    }
                  >
                    <Checkbox
                      checked={filterSubSelected.closed}
                      onClick={(event) =>
                        handleFilterSubOptionClick("closed", event)
                      }
                    />
                    <span>Closed</span>
                  </div>

                  <div
                    className={
                      filterSubSelected.replied
                        ? "sub-row selected"
                        : "sub-row"
                    }
                    onClick={(event) =>
                      handleFilterSubOptionClick("replied", event)
                    }
                  >
                    <Checkbox
                      checked={filterSubSelected.replied}
                      onClick={(event) =>
                        handleFilterSubOptionClick("replied", event)
                      }
                    />
                    <span>Replied</span>
                  </div>

                  <div
                    className={
                      filterSubSelected.unreplied
                        ? "sub-row selected"
                        : "sub-row"
                    }
                    onClick={(event) =>
                      handleFilterSubOptionClick("unreplied", event)
                    }
                  >
                    <Checkbox
                      checked={filterSubSelected.unreplied}
                      onClick={(event) =>
                        handleFilterSubOptionClick("unreplied", event)
                      }
                    />
                    <span>Unreplied</span>
                  </div>

                  <div
                    className={
                      filterSubSelected.blocked
                        ? "sub-row selected"
                        : "sub-row"
                    }
                    onClick={(event) =>
                      handleFilterSubOptionClick("blocked", event)
                    }
                  >
                    <Checkbox
                      checked={filterSubSelected.blocked}
                      onClick={(event) =>
                        handleFilterSubOptionClick("blocked", event)
                      }
                    />
                    <span>Blocked</span>
                  </div>

                </div>
              )}

              {activeFilterOption === "labels" && (
            <div
              ref={openPanelRef}
              className="search-container"
              onClick={(event) => event.stopPropagation()}
            >
              <input
                type="text"
                className="search-input"
                placeholder="Search"
                autoFocus
              />
            </div>
          )}

              {activeFilterOption === "countries" && (
                <div className="sub-panel">

                  <div
                    className={
                      filterSubSelected.india
                        ? "sub-row selected"
                        : "sub-row"
                    }
                    onClick={(event) =>
                      handleFilterSubOptionClick("india", event)
                    }
                  >
                    <Checkbox
                      checked={filterSubSelected.india}
                      onClick={(event) =>
                        handleFilterSubOptionClick("india", event)
                      }
                    />
                    <span>India</span>
                  </div>

                  <div
                    className={
                      filterSubSelected.usa
                        ? "sub-row selected"
                        : "sub-row"
                    }
                    onClick={(event) =>
                      handleFilterSubOptionClick("usa", event)
                    }
                  >
                    <Checkbox
                      checked={filterSubSelected.usa}
                      onClick={(event) =>
                        handleFilterSubOptionClick("usa", event)
                      }
                    />
                    <span>USA</span>
                  </div>

                  <div
                    className={
                      filterSubSelected.uk
                        ? "sub-row selected"
                        : "sub-row"
                    }
                    onClick={(event) =>
                      handleFilterSubOptionClick("uk", event)
                    }
                  >
                    <Checkbox
                      checked={filterSubSelected.uk}
                      onClick={(event) =>
                        handleFilterSubOptionClick("uk", event)
                      }
                    />
                    <span>UK</span>
                  </div>

                </div>
              )}

            </div>
          )}

          {activeMenu === "search" && (
            <div
              ref={openPanelRef}
              className="search-container"
              onClick={(event) => event.stopPropagation()}
            >
              <input
                type="text"
                className="search-input"
                placeholder="Search"
                autoFocus
              />
            </div>
          )}

          {activeMenu === "new" && (
            <div
              ref={openPanelRef}
              className="new-container"
              onClick={(event) => event.stopPropagation()}
            >

              <div className="new-panel">
                <div
                  className={
                    newSelected.templateName
                      ? "new-row selected"
                      : "new-row"
                  }
                >
                  <Checkbox
                    checked={newSelected.templateName}
                    onClick={(event) =>
                      handleNewOptionClick("templateName", event)
                    }
                  />

                  <span
                    className="new-label"
                    onClick={(event) =>
                      handleNewOptionClick("templateName", event)
                    }
                  >
                    Template Name
                  </span>

                  <span
                    className="new-arrow"
                    onClick={(event) =>
                      handleNewArrowClick("templateName", event)
                    }
                  >
                    {activeNewOption === "templateName" ? (
                      <FaChevronDown />
                    ) : (
                      <FaChevronRight />
                    )}
                  </span>
                </div>

              </div>

              {activeNewOption === "templateName" && (
                <div className="new-sub-panel">

                  <div
                    className={
                      newSubSelected.template1
                        ? "sub-row selected"
                        : "sub-row"
                    }
                    onClick={(event) =>
                      handleNewSubOptionClick("template1", event)
                    }
                  >
                    <Checkbox
                      checked={newSubSelected.template1}
                      onClick={(event) =>
                        handleNewSubOptionClick("template1", event)
                      }
                    />

                    <span>Template 1</span>
                  </div>

                  <div
                    className={
                      newSubSelected.template2
                        ? "sub-row selected"
                        : "sub-row"
                    }
                    onClick={(event) =>
                      handleNewSubOptionClick("template2", event)
                    }
                  >
                    <Checkbox
                      checked={newSubSelected.template2}
                      onClick={(event) =>
                        handleNewSubOptionClick("template2", event)
                      }
                    />

                    <span>Template 2</span>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default Inbox;