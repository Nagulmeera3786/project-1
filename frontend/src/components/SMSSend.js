import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { getProfessionalErrorMessage } from '../errorHelpers';
import { calculateSmsMeta } from '../smsLength';
import { FaPaperPlane, FaArrowLeft } from 'react-icons/fa';

const MAX_SMS_UPLOAD_MB = 250;
const MAX_SMS_SEGMENTS = 10;

export default function SMSSend() {
  const [profileLoading, setProfileLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [transport, setTransport] = useState('api');
  const [smppProfile, setSmppProfile] = useState('standard');
  const [selectedSenderId, setSelectedSenderId] = useState('');
  const [manualSenderId, setManualSenderId] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [smsType, setSmsType] = useState('transactional');
  const [destinationCountry, setDestinationCountry] = useState('OTHER');
  const [dltFields, setDltFields] = useState({
    templateId: '',
    entityId: '',
    telemarketerId: '',
  });
  const [recipientNumber, setRecipientNumber] = useState('');
  const [recipientUserId, setRecipientUserId] = useState('');
  const [sendMode, setSendMode] = useState('single');
  const [sourceFile, setSourceFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileMeta, setSelectedFileMeta] = useState(null);
  const [showUploadStatusBar, setShowUploadStatusBar] = useState(true);
  const [fileError, setFileError] = useState('');
  const [uploadFailureReason, setUploadFailureReason] = useState('');
  const sourceFileInputRef = useRef(null);

  const [deliveryMode, setDeliveryMode] = useState('instant');
  const [timezoneName, setTimezoneName] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [timezoneSearchInput, setTimezoneSearchInput] = useState('');
  const [timezoneOptions, setTimezoneOptions] = useState([]);
  const [timezonesLoading, setTimezonesLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [shortUrls, setShortUrls] = useState([]);
  const [hoveredShortUrlId, setHoveredShortUrlId] = useState('');
  const [selectedShortUrlId, setSelectedShortUrlId] = useState('');
  const [newLinkName, setNewLinkName] = useState('');
  const [newRedirectUrl, setNewRedirectUrl] = useState('');
  const [creatingShortUrl, setCreatingShortUrl] = useState(false);

  const [users, setUsers] = useState([]);
  const [senderIds, setSenderIds] = useState([]);
  const [smppConfig, setSmppConfig] = useState({
    host: '',
    port: '2775',
    systemId: '',
    password: '',
    templateId: '',
    entityId: '',
    telemarketerId: '',
    sourceAddrTon: '5',
    sourceAddrNpi: '0',
    destAddrTon: '1',
    destAddrNpi: '1',
    dataCoding: '0',
    registeredDelivery: true,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadProgressPct, setUploadProgressPct] = useState(0);
  const [sendingProgressPct, setSendingProgressPct] = useState(0);
  const [progressState, setProgressState] = useState('idle');
  const navigate = useNavigate();
  const isSmppTransport = transport === 'smpp';

  const allTimezones = useMemo(
    () => (typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : [
        'UTC', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
        'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Chicago',
        'America/Denver', 'America/Los_Angeles', 'Australia/Sydney'
      ]),
    []
  );

  const getTimezoneOffsetLabel = (timeZone) => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'shortOffset',
      }).formatToParts(new Date());

      const zonePart = parts.find((part) => part.type === 'timeZoneName')?.value || 'GMT+00:00';
      const normalized = zonePart.replace('GMT', '').trim();
      if (!normalized) {
        return 'UTC+00:00';
      }

      const match = normalized.match(/^([+-])(\d{1,2})(?::?(\d{2}))?$/);
      if (!match) {
        return `UTC${normalized}`;
      }

      const sign = match[1];
      const hours = match[2].padStart(2, '0');
      const minutes = (match[3] || '00').padStart(2, '0');
      return `UTC${sign}${hours}:${minutes}`;
    } catch (err) {
      return 'UTC+00:00';
    }
  };

  const getOffsetCompactLabel = (offsetLabel) => (offsetLabel || 'UTC+00:00').replace('UTC', '').replace(':', '.');

  const getTimezoneFamilyLabel = (timeZone) => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'longGeneric',
      }).formatToParts(new Date());

      const zonePart = parts.find((part) => part.type === 'timeZoneName')?.value || '';
      const normalized = zonePart.trim();
      if (!normalized || /^gmt/i.test(normalized)) {
        return timeZone;
      }
      return normalized;
    } catch (err) {
      return timeZone;
    }
  };

  const normalizeTimezoneOptions = useMemo(() => {
    const deduped = [];
    const seen = new Set();

    timezoneOptions.forEach((zone) => {
      const timezoneValue = (zone.timezone_name || '').trim();
      if (!timezoneValue) {
        return;
      }

      const countryName = zone.country_name || 'Other';
      const offsetLabel = zone.offset_label || getTimezoneOffsetLabel(timezoneValue);
      const offsetCompact = zone.offset_compact || getOffsetCompactLabel(offsetLabel);
      const timezoneFamily = zone.timezone_family || getTimezoneFamilyLabel(timezoneValue);
      const dedupeKey = `${countryName.toLowerCase()}|${timezoneFamily.toLowerCase()}|${offsetCompact}`;

      if (seen.has(dedupeKey)) {
        return;
      }

      seen.add(dedupeKey);
      deduped.push({
        ...zone,
        country_name: countryName,
        timezone_name: timezoneValue,
        offset_label: offsetLabel,
        offset_compact: offsetCompact,
        offset_minutes: Number.isFinite(Number(zone.offset_minutes)) ? Number(zone.offset_minutes) : 0,
        timezone_family: timezoneFamily,
        display_label: `${timezoneFamily} (${offsetCompact})`,
      });
    });

    deduped.sort((first, second) => {
      const countrySort = (first.country_name || '').localeCompare(second.country_name || '');
      if (countrySort !== 0) {
        return countrySort;
      }

      const offsetSort = (first.offset_minutes || 0) - (second.offset_minutes || 0);
      if (offsetSort !== 0) {
        return offsetSort;
      }

      return (first.display_label || '').localeCompare(second.display_label || '');
    });

    return deduped;
  }, [timezoneOptions]);

  const getFallbackTimezoneOptions = () => {
    return allTimezones.map((zone) => ({
      country_code: 'ZZ',
      country_name: 'Other',
      timezone_name: zone,
      city_label: zone.split('/').slice(-1)[0].replace(/_/g, ' '),
      offset_label: getTimezoneOffsetLabel(zone),
      offset_compact: getOffsetCompactLabel(getTimezoneOffsetLabel(zone)),
      offset_minutes: 0,
      timezone_family: getTimezoneFamilyLabel(zone),
      display_label: `${getTimezoneFamilyLabel(zone)} (${getOffsetCompactLabel(getTimezoneOffsetLabel(zone))})`,
    }));
  };

  const getApiErrorMessage = (payload) => {
    if (!payload) {
      return '';
    }

    if (typeof payload === 'string') {
      return payload;
    }

    if (payload.detail && typeof payload.detail === 'string') {
      return payload.detail;
    }

    const fieldMessages = Object.entries(payload)
      .filter(([key]) => key !== 'detail')
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(', ')}`;
        }
        if (typeof value === 'string') {
          return `${key}: ${value}`;
        }
        return '';
      })
      .filter(Boolean);

    if (fieldMessages.length > 0) {
      return fieldMessages.join(' | ');
    }

    return 'Request failed';
  };

  const selectedTimezone = timezoneOptions.find((option) => option.timezone_name === timezoneName);
  const selectedTimezoneLabel = selectedTimezone
    ? `${timezoneName} (${selectedTimezone.offset_compact || '+0.00'})`
    : timezoneName;
  const showPersonalizedGuide = sendMode === 'personalized_file' && !messageContent.trim();
  const smsMeta = useMemo(
    () => calculateSmsMeta(messageContent, MAX_SMS_SEGMENTS),
    [messageContent]
  );
  const effectiveSenderId = useMemo(
    () => (isSmppTransport ? manualSenderId : (manualSenderId || selectedSenderId || '')).trim(),
    [isSmppTransport, manualSenderId, selectedSenderId]
  );

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profileLoading || !isAdmin) {
      return;
    }

    fetchUsers();
    fetchSenderIds();
    fetchGroups();
    fetchShortUrls();
    fetchTimezoneOptions();
  }, [profileLoading, isAdmin]);

  useEffect(() => {
    if (timezoneOptions.length > 0 && !timezoneOptions.some((option) => option.timezone_name === timezoneName)) {
      const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const browserMatch = timezoneOptions.find((option) => option.timezone_name === browserZone);
      setTimezoneName(browserMatch ? browserMatch.timezone_name : timezoneOptions[0].timezone_name);
    }
  }, [timezoneOptions, timezoneName]);

  useEffect(() => {
    if (isSmppTransport && deliveryMode === 'scheduled') {
      setDeliveryMode('instant');
    }
  }, [isSmppTransport, deliveryMode]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const cached = window.sessionStorage.getItem('sms_send_selected_file_meta');
    if (!cached) {
      return;
    }

    try {
      const parsed = JSON.parse(cached);
      if (parsed?.name) {
        setSelectedFileName(String(parsed.name));
        setSelectedFileMeta(parsed);
      }
    } catch {
      window.sessionStorage.removeItem('sms_send_selected_file_meta');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const hasPendingUploadSelection = Boolean(selectedFileName);
    if (!hasPendingUploadSelection) {
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [selectedFileName]);

  const fetchTimezoneOptions = async () => {
    setTimezonesLoading(true);
    try {
      const response = await API.get('sms/timezones/');
      const result = Array.isArray(response.data?.results) ? response.data.results : [];
      setTimezoneOptions(result);
    } catch (err) {
      setTimezoneOptions(getFallbackTimezoneOptions());
    } finally {
      setTimezonesLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await API.get('profile/');
      setIsAdmin(Boolean(response.data?.is_staff));
    } catch (err) {
      setIsAdmin(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleTimezoneSearchReset = async () => {
    setTimezoneSearchInput('');
  };

  const filteredTimezoneOptions = useMemo(() => {
    const term = timezoneSearchInput.trim().toLowerCase();
    if (!term) {
      return normalizeTimezoneOptions;
    }

    const countryMap = new Map();
    normalizeTimezoneOptions.forEach((zone) => {
      const country = zone.country_name || 'Other';
      if (!countryMap.has(country)) {
        countryMap.set(country, []);
      }
      countryMap.get(country).push(zone);
    });

    const filtered = [];
    countryMap.forEach((zones, country) => {
      const countryMatch = country.toLowerCase().includes(term);
      if (countryMatch) {
        filtered.push(...zones);
        return;
      }

      zones.forEach((zone) => {
        const timezoneText = (zone.timezone_name || '').toLowerCase();
        const timezoneFamilyText = (zone.timezone_family || '').toLowerCase();
        const cityText = (zone.city_label || '').toLowerCase();
        const displayText = (zone.display_label || '').toLowerCase();
        const offsetText = (zone.offset_label || '').toLowerCase();
        if (timezoneText.includes(term) || timezoneFamilyText.includes(term) || cityText.includes(term) || displayText.includes(term) || offsetText.includes(term)) {
          filtered.push(zone);
        }
      });
    });

    return filtered;
  }, [normalizeTimezoneOptions, timezoneSearchInput]);

  const groupedTimezoneOptions = useMemo(() => {
    return filteredTimezoneOptions.reduce((accumulator, current) => {
      const key = current.country_name || 'Other';
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(current);
      return accumulator;
    }, {});
  }, [filteredTimezoneOptions]);

  const groupedTimezoneEntries = useMemo(
    () => Object.entries(groupedTimezoneOptions).sort(([first], [second]) => first.localeCompare(second)),
    [groupedTimezoneOptions]
  );

  const fetchUsers = async () => {
    try {
      const response = await API.get('sms/admin/users/');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchSenderIds = async () => {
    try {
      const response = await API.get('sms/credentials/');
      if (response.data && response.data.sender_ids) {
        const uniqueSenderIds = [...new Set(response.data.sender_ids.map((id) => String(id).trim()).filter(Boolean))];
        setSenderIds(uniqueSenderIds);
        if (uniqueSenderIds.length > 0) {
          setSelectedSenderId(uniqueSenderIds[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching sender IDs:', err);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await API.get('sms/groups/');
      setGroups(response.data || []);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const fetchShortUrls = async () => {
    try {
      const response = await API.get('sms/short-urls/');
      setShortUrls(response.data || []);
    } catch (err) {
      console.error('Error fetching short URLs:', err);
    }
  };

  const getModeRequirements = () => {
    if (sendMode === 'file_numbers') {
      return `Upload .txt/.xls/.xlsx file (max ${MAX_SMS_UPLOAD_MB}MB). File should contain mobile numbers.`;
    }
    if (sendMode === 'personalized_file') {
      return `Upload .xls/.xlsx file (max ${MAX_SMS_UPLOAD_MB}MB). Use #1#, #2#, #3# in message template for Excel columns.`;
    }
    if (sendMode === 'group') {
      return 'Select a phonebook group. SMS will be sent to all members in the selected group.';
    }
    return 'Single recipient mode (existing flow). Enter one recipient number.';
  };

  const handleModeChange = (mode) => {
    setSendMode(mode);
    setSourceFile(null);
    setSelectedFileName('');
    setSelectedFileMeta(null);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('sms_send_selected_file_meta');
    }
    setFileError('');
    setUploadFailureReason('');
    setError('');
  };

  const handleTransportChange = (nextTransport) => {
    setTransport(nextTransport);
    setError('');
    setSuccess('');
  };

  const handleSmppConfigChange = (field, value) => {
    setSmppConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDltChange = (field, value) => {
    setDltFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (event?.stopPropagation) {
      event.stopPropagation();
    }

    const file = event.target.files?.[0];
    setFileError('');
    setUploadFailureReason('');
    setSourceFile(null);
    setSelectedFileName('');
    setSelectedFileMeta(null);

    if (!file) {
      return;
    }

    if (file.size > MAX_SMS_UPLOAD_MB * 1024 * 1024) {
      setFileError(`File size must be under ${MAX_SMS_UPLOAD_MB}MB`);
      return;
    }

    const lower = (file.name || '').toLowerCase();
    if (sendMode === 'file_numbers' && !(lower.endsWith('.txt') || lower.endsWith('.xls') || lower.endsWith('.xlsx'))) {
      setFileError('Upload Mobile Numbers File accepts only .txt, .xls, or .xlsx files.');
      return;
    }

    if (sendMode === 'personalized_file' && !(lower.endsWith('.xls') || lower.endsWith('.xlsx'))) {
      setFileError('Upload Personalized SMS Excel accepts only .xls or .xlsx files.');
      return;
    }

    setSourceFile(file);
    setSelectedFileName(file.name || '');
    const nextMeta = {
      name: file.name || '',
      size: Number(file.size || 0),
      type: file.type || 'Unknown',
      selectedAt: new Date().toISOString(),
    };
    setSelectedFileMeta(nextMeta);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('sms_send_selected_file_meta', JSON.stringify(nextMeta));
    }
  };

  const handleChooseFileClick = (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (event?.stopPropagation) {
      event.stopPropagation();
    }
    sourceFileInputRef.current?.click();
  };

  const handleCreateGroup = async () => {
    setError('');
    setSuccess('');

    const groupName = newGroupName.trim();
    const members = newGroupMembers
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!groupName) {
      setError('Please enter group name');
      return;
    }

    if (members.length === 0) {
      setError('Please add at least one group member');
      return;
    }

    setCreatingGroup(true);
    try {
      await API.post('sms/groups/', {
        name: groupName,
        members,
      });
      setSuccess('Group saved successfully');
      setNewGroupName('');
      setNewGroupMembers('');
      await fetchGroups();
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Failed to create group'));
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleCreateShortUrl = async () => {
    setError('');
    setSuccess('');

    if (!newLinkName.trim() || !newRedirectUrl.trim()) {
      setError('Please provide link name and redirect URL');
      return;
    }

    setCreatingShortUrl(true);
    try {
      await API.post('sms/short-urls/', {
        link_name: newLinkName.trim(),
        redirect_url: newRedirectUrl.trim(),
      });
      setSuccess('Short URL created');
      setNewLinkName('');
      setNewRedirectUrl('');
      await fetchShortUrls();
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Failed to create short URL'));
    } finally {
      setCreatingShortUrl(false);
    }
  };

  const handleInsertShortUrl = () => {
    const selected = shortUrls.find((item) => String(item.id) === String(selectedShortUrlId));
    if (!selected || !selected.short_url) {
      setError('Please select a short URL to insert');
      return;
    }

    const appended = messageContent ? `${messageContent} ${selected.short_url}` : selected.short_url;
    setMessageContent(appended);
  };

  const handleDeleteShortUrl = async (urlId) => {
    try {
      await API.delete(`sms/short-urls/${urlId}/`);
      setShortUrls((prev) => prev.filter((item) => item.id !== urlId));
      if (String(selectedShortUrlId) === String(urlId)) {
        setSelectedShortUrlId('');
      }
    } catch (err) {
      setError(getProfessionalErrorMessage(err, 'Failed to delete short URL'));
    }
  };

  const handleSendSMS = async (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    setError('');
    setSuccess('');
    setUploadFailureReason('');
    setLoading(true);
    setSendingProgressPct(0);

    const hasFileUpload = sendMode === 'file_numbers' || sendMode === 'personalized_file';
    setUploadProgressPct(hasFileUpload ? 0 : 100);
    setProgressState(hasFileUpload ? 'uploading' : 'sending');

    if (!effectiveSenderId) {
      setError(isSmppTransport ? 'Please enter SMPP sender ID' : 'Please select a sender ID or enter one manually');
      setLoading(false);
      return;
    }

    if (!smsType) {
      setError('Please select SMS type');
      setLoading(false);
      return;
    }

    if (!smsMeta.isWithinLimit) {
      setError(`Message is too long: ${smsMeta.segments} SMS segments detected. Maximum allowed is ${MAX_SMS_SEGMENTS} segments.`);
      setLoading(false);
      return;
    }

    if (sendMode === 'single' && !recipientNumber.trim()) {
      setError('Please enter recipient phone number');
      setLoading(false);
      return;
    }

    if (sendMode === 'group' && !selectedGroupId) {
      setError('Please select a group');
      setLoading(false);
      return;
    }

    if ((sendMode === 'file_numbers' || sendMode === 'personalized_file') && !sourceFile) {
      setError(fileError || 'Please upload required file');
      setLoading(false);
      return;
    }

    if (deliveryMode === 'scheduled' && (!timezoneName || !startDate || !startTime)) {
      setError('Please select timezone, start date and start time for scheduling');
      setLoading(false);
      return;
    }

    if (isSmppTransport) {
      if (!smppConfig.host.trim() || !smppConfig.systemId.trim() || !smppConfig.password.trim()) {
        setError('Please enter SMPP host, system ID and password');
        setLoading(false);
        return;
      }

      if (smppProfile === 'dlt') {
        if (!smppConfig.templateId.trim()) {
          setError('Please enter Template ID for DLT SMPP sending');
          setLoading(false);
          return;
        }

        if (!smppConfig.entityId.trim()) {
          setError('Please enter Entity ID for DLT SMPP sending');
          setLoading(false);
          return;
        }

        if (!smppConfig.telemarketerId.trim()) {
          setError('Please enter Telemarketer ID for DLT SMPP sending');
          setLoading(false);
          return;
        }
      }
    }

    const payload = new FormData();
    payload.append('transport', transport);
    payload.append('display_sender_id', effectiveSenderId);
    payload.append('message_content', messageContent);
    payload.append('sms_type', smsType);
    payload.append('send_mode', sendMode);
    payload.append('delivery_mode', deliveryMode);
    payload.append('destination_country', destinationCountry);

    if (destinationCountry === 'IN') {
      payload.append('dlt_template_id', dltFields.templateId.trim());
      payload.append('dlt_entity_id', dltFields.entityId.trim());
      payload.append('dlt_telemarketer_id', dltFields.telemarketerId.trim());
    }

    if (isSmppTransport) {
      payload.append('smpp_profile', smppProfile);
      payload.append('smpp_host', smppConfig.host.trim());
      payload.append('smpp_port', smppConfig.port || '2775');
      payload.append('smpp_system_id', smppConfig.systemId.trim());
      payload.append('smpp_password', smppConfig.password);
      payload.append('smpp_source_addr_ton', smppConfig.sourceAddrTon || '5');
      payload.append('smpp_source_addr_npi', smppConfig.sourceAddrNpi || '0');
      payload.append('smpp_dest_addr_ton', smppConfig.destAddrTon || '1');
      payload.append('smpp_dest_addr_npi', smppConfig.destAddrNpi || '1');
      payload.append('smpp_data_coding', smppConfig.dataCoding || '0');
      payload.append('smpp_registered_delivery', smppConfig.registeredDelivery ? 'true' : 'false');

      if (smppProfile === 'dlt') {
        payload.append('smpp_template_id', smppConfig.templateId.trim());
        payload.append('dlt_template_id', smppConfig.templateId.trim());
        payload.append('dlt_entity_id', smppConfig.entityId.trim());
        payload.append('dlt_telemarketer_id', smppConfig.telemarketerId.trim());
      }
    }

    if (deliveryMode === 'scheduled') {
      payload.append('timezone_name', timezoneName);
      payload.append('start_date', startDate);
      payload.append('start_time', startTime);
    }

    if (sendMode === 'single') {
      payload.append('recipient_number', recipientNumber);
      if (recipientUserId) {
        payload.append('recipient_user_id', recipientUserId);
      }
    }

    if (sendMode === 'group') {
      payload.append('group_id', selectedGroupId);
    }

    if ((sendMode === 'file_numbers' || sendMode === 'personalized_file') && sourceFile) {
      payload.append('source_file', sourceFile);
    }

    try {
      const response = await API.post('sms/send/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: sendMode === 'single' ? 30000 : 1800000,
        onUploadProgress: (progressEvent) => {
          if (!hasFileUpload) {
            return;
          }

          const totalBytes = Number(progressEvent.total || 0);
          const loadedBytes = Number(progressEvent.loaded || 0);
          if (totalBytes <= 0) {
            return;
          }

          const percent = Math.min(100, Math.round((loadedBytes / totalBytes) * 100));
          setUploadProgressPct(percent);
          if (percent >= 100) {
            setProgressState('sending');
          }
        },
      });

      const responseData = response.data || {};
      const isSmppDlt = transport === 'smpp' && smppProfile === 'dlt';
      const dltMessageIds = [];

      if (responseData?.message_id) {
        dltMessageIds.push(String(responseData.message_id));
      }

      if (Array.isArray(responseData?.message_ids)) {
        responseData.message_ids.forEach((id) => {
          if (id) {
            dltMessageIds.push(String(id));
          }
        });
      }

      if (responseData?.total_targets) {
        const totalTargets = Number(responseData.total_targets || 0);
        const sentCount = Number(responseData.sent_count || 0);
        const sentPercent = totalTargets > 0 ? Math.min(100, Math.round((sentCount / totalTargets) * 100)) : 0;
        setSendingProgressPct(sentPercent);
        setUploadProgressPct(100);
        setProgressState('completed');

        if (isSmppDlt) {
          setSuccess(dltMessageIds.length > 0 ? dltMessageIds.join(', ') : 'N/A');
        } else {
          setSuccess(
            `Completed via ${responseData.transport === 'smpp' ? 'SMPP' : 'SMS API'}. Total: ${responseData.total_targets}, Sent: ${responseData.sent_count}, Scheduled: ${responseData.scheduled_count}, Failed: ${responseData.failed_count}, Skipped: ${responseData.skipped_rows}`
          );
        }

        if (!isSmppDlt && responseData.failed_count > 0) {
          const summaryText = Array.isArray(responseData.failure_summary)
            ? responseData.failure_summary
              .slice(0, 3)
              .map((item) => `${item.reason} (${item.count})`)
              .join(' | ')
            : '';

          const sampleText = Array.isArray(responseData.failed_examples)
            ? responseData.failed_examples
              .slice(0, 3)
              .map((item) => `${item.recipient_number}: ${item.reason}`)
              .join(' | ')
            : '';

          const errorText = summaryText || sampleText || 'Some messages failed to send.';
          setError(`Failure reason(s): ${errorText}`);
        }
      } else if (responseData?.delivery_action === 'failed' || responseData?.status === 'failed') {
        setProgressState('failed');
        const reason = responseData.failure_reason || responseData.detail || 'Unknown reason from SMS provider';
        setError(`Failed to send SMS: ${reason}`);
        return;
      } else if (responseData?.delivery_action === 'scheduled') {
        setSendingProgressPct(100);
        setUploadProgressPct(100);
        setProgressState('completed');
        setSuccess('SMS scheduled successfully');
      } else {
        setSendingProgressPct(100);
        setUploadProgressPct(100);
        setProgressState('completed');
        if (isSmppDlt) {
          setSuccess(dltMessageIds.length > 0 ? dltMessageIds.join(', ') : 'N/A');
        } else {
          setSuccess(`${responseData.transport === 'smpp' ? 'SMPP' : 'SMS'} sent successfully! Message ID: ${responseData.message_id || 'N/A'}`);
        }
      }

      if (!isSmppTransport) {
        setSenderIds((prevIds) => {
          const updated = prevIds.includes(effectiveSenderId) ? prevIds : [...prevIds, effectiveSenderId];
          return updated;
        });

        setSelectedSenderId(effectiveSenderId);
      }

      setManualSenderId('');
      if (sendMode !== 'personalized_file') {
        setMessageContent('');
      }
      if (sendMode === 'single') {
        setRecipientNumber('');
        setRecipientUserId('');
      }
      if (sendMode === 'file_numbers' || sendMode === 'personalized_file') {
        setSourceFile(null);
        setSelectedFileName('');
        setSelectedFileMeta(null);
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('sms_send_selected_file_meta');
        }
      }
    } catch (err) {
      setProgressState('failed');
      const responseData = err.response?.data;
      const uploadModeActive = sendMode === 'file_numbers' || sendMode === 'personalized_file';
      const detailFromApi = responseData?.detail || '';
      const skippedRows = Number(responseData?.skipped_rows || 0);

      if (uploadModeActive) {
        if (detailFromApi) {
          const extra = skippedRows > 0 ? ` Skipped rows: ${skippedRows}.` : '';
          setUploadFailureReason(`Upload failed: ${detailFromApi}${extra}`);
        } else if (err.response?.status === 413) {
          setUploadFailureReason(`Upload failed: File is too large for server limits. Try a smaller file (current UI limit ${MAX_SMS_UPLOAD_MB}MB).`);
        } else if (err.code === 'ECONNABORTED' || String(err.message || '').toLowerCase().includes('timeout')) {
          setUploadFailureReason('Upload failed: Request timed out while uploading/processing the file. Please try again with a smaller file or fewer rows.');
        } else if (!err.response) {
          setUploadFailureReason('Upload failed: Network error while uploading the file. Check connection and backend status, then retry.');
        }
      }

      if (!err.response && (err.code === 'ECONNABORTED' || String(err.message || '').toLowerCase().includes('timeout'))) {
        setError('Request timed out while processing bulk SMS. Please retry; large files may take longer to upload and dispatch.');
      } else if (!err.response) {
        setError('Network error while sending SMS. Check backend server status and internet connectivity, then retry.');
      } else {
        setError(getApiErrorMessage(err.response?.data) || err.message || 'Failed to send SMS');
      }
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return <div style={{ padding: '24px' }}>Loading SMS page...</div>;
  }

  const formatFileSize = (bytes) => {
    const value = Number(bytes || 0);
    if (value < 1024) {
      return `${value} B`;
    }
    if (value < 1024 * 1024) {
      return `${(value / 1024).toFixed(1)} KB`;
    }
    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isUploadMode = sendMode === 'file_numbers' || sendMode === 'personalized_file';

  const getUploadStatusText = () => {
    if (progressState === 'uploading') {
      return 'Uploading file...';
    }
    if (progressState === 'sending') {
      return 'Upload complete. Sending SMS...';
    }
    if (progressState === 'completed') {
      return 'Upload and processing completed.';
    }
    if (progressState === 'failed') {
      return 'Upload or processing failed. Check error and retry.';
    }
    if (selectedFileName) {
      return 'File selected. Click Send SMS to start upload.';
    }
    return 'No file selected yet.';
  };

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #F5F1FF 0%, #F0EFFE 100%)', padding: '20px' }}>
        <div style={{ width: '50vw', maxWidth: '680px', minWidth: '360px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(26, 14, 78, 0.08)', border: '1px solid #EDE8FB', padding: '24px', textAlign: 'center' }}>
          <h3 style={{ marginTop: 0, color: '#1A0E4E' }}>Welcome New User</h3>
          <p style={{ color: '#555', marginBottom: '18px' }}>
            You currently have free trial access for SMS. Choose an option to continue.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('/sms/free-trial')}
              style={{ border: 'none', borderRadius: '6px', padding: '10px 18px', backgroundColor: '#1976d2', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Free Trial
            </button>
            <button
              type="button"
              onClick={() => alert('Please contact admin to upgrade your SMS plan.')}
              style={{ border: 'none', borderRadius: '6px', padding: '10px 18px', backgroundColor: '#ff9800', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          backgroundColor: '#F5F3FF',
          border: 'none',
          padding: '8px 15px',
          borderRadius: '8px',
          cursor: 'pointer',
          color: '#5B3FA8',
          fontWeight: 600,
        }}
      >
        <FaArrowLeft /> Back to Dashboard
      </button>

      <h2 style={{ color: '#1A0E4E', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <span>
            <FaPaperPlane style={{ marginRight: '10px' }} />
            Send SMS Message
          </span>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: '#f5f7fb', border: '1px solid #d9e2f1', borderRadius: '999px' }}>
            <span style={{ fontSize: '13px', color: '#475467', fontWeight: 'bold' }}>Transport</span>
            <button
              type="button"
              onClick={() => handleTransportChange('api')}
              style={{
                border: 'none',
                borderRadius: '999px',
                padding: '8px 14px',
                backgroundColor: transport === 'api' ? '#5B3FA8' : 'transparent',
                color: transport === 'api' ? '#fff' : '#4B4B6B',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              SMS API
            </button>
            <button
              type="button"
              onClick={() => handleTransportChange('smpp')}
              style={{
                border: 'none',
                borderRadius: '999px',
                padding: '8px 14px',
                backgroundColor: transport === 'smpp' ? '#7C5DC7' : 'transparent',
                color: transport === 'smpp' ? '#fff' : '#4B4B6B',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              SMPP
            </button>
          </div>
        </div>
      </h2>

      {success && (
        <div
          style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            borderRadius: '6px',
            border: '1px solid #4caf50',
          }}
        >
          {success}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#ffebee',
            color: '#d32f2f',
            borderRadius: '6px',
            border: '1px solid #f44336',
          }}
        >
          {error}
        </div>
      )}

      {progressState !== 'idle' && (
        <div
          style={{
            padding: '14px',
            marginBottom: '20px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #dbe4f0',
          }}
        >
          <div style={{ fontWeight: 'bold', color: '#1A0E4E', marginBottom: '8px' }}>
            SMS Send Status
          </div>

          <div style={{ fontSize: '13px', color: '#344054', marginBottom: '6px' }}>
            Upload progress: {uploadProgressPct}%
          </div>
          <div style={{ width: '100%', height: '8px', borderRadius: '999px', backgroundColor: '#e8eef7', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{ width: `${uploadProgressPct}%`, height: '100%', background: 'linear-gradient(90deg, #5B3FA8, #7C5DC7)' }} />
          </div>

          <div style={{ fontSize: '13px', color: '#344054', marginBottom: '6px' }}>
            SMS send percentage: {sendingProgressPct}%
          </div>
          {loading && progressState === 'sending' ? (
            <progress style={{ width: '100%', height: '10px' }} />
          ) : (
            <div style={{ width: '100%', height: '8px', borderRadius: '999px', backgroundColor: '#e8eef7', overflow: 'hidden' }}>
              <div style={{ width: `${sendingProgressPct}%`, height: '100%', background: 'linear-gradient(90deg, #0ea5e9, #0284c7)' }} />
            </div>
          )}

          <div style={{ marginTop: '10px', fontSize: '12px', color: '#475467' }}>
            {progressState === 'uploading' && 'Uploading file...'}
            {progressState === 'sending' && 'File uploaded. Sending SMS to recipients...'}
            {progressState === 'completed' && 'SMS processing completed.'}
            {progressState === 'failed' && 'SMS processing failed. Please check the error and retry.'}
          </div>
        </div>
      )}

      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {/* Sender ID Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
            Sender ID *
          </label>
          <div style={{ maxWidth: '360px' }}>
            {!isSmppTransport && (
              <>
                <select
                  value={selectedSenderId}
                  onChange={(e) => setSelectedSenderId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select Sender ID</option>
                  {senderIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
                <small style={{ color: '#999', display: 'block', marginTop: '6px' }}>
                  Select from existing sender IDs or enter a new one below.
                </small>
              </>
            )}
            <input
              type="text"
              value={manualSenderId}
              onChange={(e) => setManualSenderId(e.target.value)}
              placeholder={isSmppTransport ? 'Enter approved SMPP sender ID' : 'Or enter sender ID manually'}
              style={{
                width: '100%',
                marginTop: isSmppTransport ? 0 : '8px',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            <small style={{ color: '#444', display: 'block', marginTop: '6px' }}>
              Selected sender ID: <strong>{(effectiveSenderId || 'Not selected')}</strong>
            </small>
          </div>
        </div>

        {isSmppTransport && (
          <div style={{ marginBottom: '20px', border: '1px solid #d7efe9', borderRadius: '10px', padding: '16px', backgroundColor: '#f7fffc' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#134e4a' }}>SMPP Configuration</div>
                <small style={{ color: '#0f766e' }}>
                  Enter connection details dynamically for this send request.
                </small>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  { key: 'standard', label: 'SMPP Without DLT' },
                  { key: 'dlt', label: 'SMPP With DLT' },
                ].map((option) => (
                  <label key={option.key} style={{ border: '1px solid #99d5c9', borderRadius: '999px', padding: '8px 12px', cursor: 'pointer', backgroundColor: smppProfile === option.key ? '#ccfbf1' : '#fff' }}>
                    <input
                      type="radio"
                      name="smpp_profile"
                      value={option.key}
                      checked={smppProfile === option.key}
                      onChange={() => setSmppProfile(option.key)}
                      style={{ marginRight: '8px' }}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <input
                type="text"
                value={smppConfig.host}
                onChange={(e) => handleSmppConfigChange('host', e.target.value)}
                placeholder="SMPP Host *"
                style={{ padding: '10px 12px', border: '1px solid #b7d7cf', borderRadius: '6px' }}
              />
              <input
                type="number"
                value={smppConfig.port}
                onChange={(e) => handleSmppConfigChange('port', e.target.value)}
                placeholder="Port *"
                style={{ padding: '10px 12px', border: '1px solid #b7d7cf', borderRadius: '6px' }}
              />
              <input
                type="text"
                value={smppConfig.systemId}
                onChange={(e) => handleSmppConfigChange('systemId', e.target.value)}
                placeholder="System ID *"
                style={{ padding: '10px 12px', border: '1px solid #b7d7cf', borderRadius: '6px' }}
              />
              <input
                type="password"
                value={smppConfig.password}
                onChange={(e) => handleSmppConfigChange('password', e.target.value)}
                placeholder="Password *"
                style={{ padding: '10px 12px', border: '1px solid #b7d7cf', borderRadius: '6px' }}
              />
            </div>

            {smppProfile === 'dlt' && (
              <div style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <input
                  type="text"
                  value={smppConfig.templateId}
                  onChange={(e) => handleSmppConfigChange('templateId', e.target.value)}
                  placeholder="DLT Template ID *"
                  style={{ padding: '10px 12px', border: '1px solid #b7d7cf', borderRadius: '6px' }}
                />
                <input
                  type="text"
                  value={smppConfig.entityId}
                  onChange={(e) => handleSmppConfigChange('entityId', e.target.value)}
                  placeholder="DLT Entity ID *"
                  style={{ padding: '10px 12px', border: '1px solid #b7d7cf', borderRadius: '6px' }}
                />
                <input
                  type="text"
                  value={smppConfig.telemarketerId}
                  onChange={(e) => handleSmppConfigChange('telemarketerId', e.target.value)}
                  placeholder="DLT Telemarketer ID *"
                  style={{ padding: '10px 12px', border: '1px solid #b7d7cf', borderRadius: '6px' }}
                />
              </div>
            )}

            <div style={{ borderTop: '1px solid #d7efe9', paddingTop: '12px' }}>
              <div style={{ fontWeight: 'bold', color: '#134e4a', marginBottom: '10px' }}>Advanced SMPP Parameters</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                <input
                  type="number"
                  value={smppConfig.sourceAddrTon}
                  onChange={(e) => handleSmppConfigChange('sourceAddrTon', e.target.value)}
                  placeholder="Source TON"
                  style={{ padding: '10px 12px', border: '1px solid #b7d7cf', borderRadius: '6px' }}
                />
                <input
                  type="number"
                  value={smppConfig.sourceAddrNpi}
                  onChange={(e) => handleSmppConfigChange('sourceAddrNpi', e.target.value)}
                  placeholder="Source NPI"
                  style={{ padding: '10px 12px', border: '1px solid #b7d7cf', borderRadius: '6px' }}
                />
                <input
                  type="number"
                  value={smppConfig.destAddrTon}
                  onChange={(e) => handleSmppConfigChange('destAddrTon', e.target.value)}
                  placeholder="Destination TON"
                  style={{ padding: '10px 12px', border: '1px solid #b7d7cf', borderRadius: '6px' }}
                />
                <input
                  type="number"
                  value={smppConfig.destAddrNpi}
                  onChange={(e) => handleSmppConfigChange('destAddrNpi', e.target.value)}
                  placeholder="Destination NPI"
                  style={{ padding: '10px 12px', border: '1px solid #b7d7cf', borderRadius: '6px' }}
                />
                <input
                  type="number"
                  value={smppConfig.dataCoding}
                  onChange={(e) => handleSmppConfigChange('dataCoding', e.target.value)}
                  placeholder="Data Coding"
                  style={{ padding: '10px 12px', border: '1px solid #b7d7cf', borderRadius: '6px' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: '1px solid #b7d7cf', borderRadius: '6px', backgroundColor: '#fff' }}>
                  <input
                    type="checkbox"
                    checked={smppConfig.registeredDelivery}
                    onChange={(e) => handleSmppConfigChange('registeredDelivery', e.target.checked)}
                  />
                  Request delivery report
                </label>
              </div>
            </div>

            <small style={{ color: '#115e59', display: 'block', marginTop: '10px' }}>
              The app submits the SMPP message immediately using these credentials. Scheduled delivery is disabled for SMPP because credentials are entered per request.
            </small>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
            SMS Type *
          </label>
          <select
            value={smsType}
            onChange={(e) => setSmsType(e.target.value)}
            required
            style={{ width: '220px', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
          >
            <option value="transactional">Transactional</option>
            <option value="promotional">Promotional</option>
            <option value="service">Service</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px', border: '1px solid #eee', borderRadius: '8px', padding: '14px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
            Destination Country
          </label>
          <select
            value={destinationCountry}
            onChange={(e) => setDestinationCountry(e.target.value)}
            style={{ width: '240px', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
          >
            <option value="OTHER">Other Countries</option>
            <option value="IN">India</option>
          </select>

          {destinationCountry === 'IN' && (
            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <input
                type="text"
                value={dltFields.templateId}
                onChange={(e) => handleDltChange('templateId', e.target.value)}
                placeholder="Template ID *"
                style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
              <input
                type="text"
                value={dltFields.entityId}
                onChange={(e) => handleDltChange('entityId', e.target.value)}
                placeholder="Entity ID *"
                style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
              <input
                type="text"
                value={dltFields.telemarketerId}
                onChange={(e) => handleDltChange('telemarketerId', e.target.value)}
                placeholder="Telemarketer ID *"
                style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>
          )}

          <small style={{ color: '#666', display: 'block', marginTop: '8px' }}>
            For India traffic, DLT identifiers are mandatory. If left empty here, backend will use configured .env defaults.
          </small>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
            Send Mode *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { key: 'single', label: 'Single Number (Existing)' },
                  { key: 'file_numbers', label: 'Upload Mobile Numbers File' },
                  { key: 'personalized_file', label: 'Upload Personalized SMS Excel' },
                  { key: 'group', label: 'Select Group from Phonebook' },
                ].map((mode) => (
                  <label key={mode.key} style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '10px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="send_mode"
                      value={mode.key}
                      checked={sendMode === mode.key}
                      onChange={() => handleModeChange(mode.key)}
                      style={{ marginRight: '8px' }}
                    />
                    {mode.label}
                  </label>
                ))}
              </div>

              {(sendMode === 'file_numbers' || sendMode === 'personalized_file') && (
                <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '10px', marginTop: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                    Upload File *
                  </label>
                  <input
                    ref={sourceFileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept={sendMode === 'file_numbers' ? '.txt,.xls,.xlsx' : '.xls,.xlsx'}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={handleChooseFileClick}
                    style={{ padding: '8px 12px', border: '1px solid #d0d5dd', borderRadius: '6px', backgroundColor: '#fff', color: '#344054', cursor: 'pointer' }}
                  >
                    Choose File
                  </button>
                  <small style={{ color: fileError ? '#d32f2f' : '#666' }}>
                    {fileError || `Maximum file size: ${MAX_SMS_UPLOAD_MB}MB`}
                  </small>
                  {selectedFileName && !fileError && (
                    <small style={{ display: 'block', marginTop: '6px', color: '#2e7d32' }}>
                      Selected file: {selectedFileName}
                    </small>
                  )}
                  {selectedFileMeta && (
                    <small style={{ display: 'block', marginTop: '4px', color: '#475467' }}>
                      File details: {formatFileSize(selectedFileMeta.size)} | {selectedFileMeta.type || 'Unknown' }
                    </small>
                  )}
                  {/*{selectedFileName && !fileError && (
                    <small style={{ display: 'block', marginTop: '4px', color: '#0d47a1' }}>
                      File selected successfully. Click "Send SMS" to upload and process this file.
                    </small>
                  )}*/}
                  {uploadFailureReason && (
                    <div style={{ marginTop: '8px', padding: '10px', border: '1px solid #ef9a9a', borderRadius: '6px', backgroundColor: '#ffebee', color: '#c62828', fontSize: '12px', lineHeight: 1.5 }}>
                      {uploadFailureReason}
                    </div>
                  )}

                  {/*<div style={{ marginTop: '10px', padding: '10px', border: '1px solid #e4e7ec', borderRadius: '6px', backgroundColor: '#fcfcfd' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#344054', marginBottom: showUploadStatusBar ? '8px' : 0 }}>
                      <input
                        type="checkbox"
                        checked={showUploadStatusBar}
                        onChange={(e) => setShowUploadStatusBar(Boolean(e.target.checked))}
                      />
                      Show Upload Status Bar
                    </label>

                    {showUploadStatusBar && isUploadMode && (
                      <>
                        <div style={{ fontSize: '12px', color: '#475467', marginBottom: '6px' }}>
                          Upload status: {uploadProgressPct}%
                        </div>
                        <div style={{ width: '100%', height: '8px', borderRadius: '999px', backgroundColor: '#e8eef7', overflow: 'hidden' }}>
                          <div style={{ width: `${uploadProgressPct}%`, height: '100%', background: 'linear-gradient(90deg, #5B3FA8, #7C5DC7)' }} />
                        </div>
                        <div style={{ marginTop: '6px', fontSize: '12px', color: '#667085' }}>
                          {getUploadStatusText()}
                        </div>
                      </>
                    )}
                  </div>*/}
                </div>
              )}
            </div>

            {sendMode === 'single' && (
              <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '10px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  Recipient Phone Number *
                </label>
                <input
                  type="tel"
                  value={recipientNumber}
                  onChange={(e) => setRecipientNumber(e.target.value)}
                  placeholder="e.g., +919876543210"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                <small style={{ color: '#666', display: 'block', marginTop: '6px' }}>
                  Enter a single destination number in international format.
                </small>

                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                    Send to User (Optional)
                  </label>
                  <select
                    value={recipientUserId}
                    onChange={(e) => setRecipientUserId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Select a user (optional)</option>
                    {users
                      .filter((u) => u.is_sms_enabled)
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </option>
                      ))}
                  </select>
                  <small style={{ color: '#999' }}>
                    Only shows users with SMS enabled
                  </small>
                </div>
              </div>
            )}
          </div>
          <small style={{ color: '#666', display: 'block', marginTop: '8px' }}>{getModeRequirements()}</small>
        </div>

        {/* Message Content */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
            Message Content *
          </label>
          <textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder={sendMode === 'personalized_file' ? 'Type your personalized SMS template here' : 'Enter your message'}
            required
            style={{
              width: '100%',
              height: '120px',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'Arial, sans-serif',
              resize: 'none',
            }}
          />
          <small style={{ color: !smsMeta.isWithinLimit ? '#d32f2f' : '#999' }}>
            Character_count: {smsMeta.lengthUnits} | no.of_messages: {smsMeta.segments}/{MAX_SMS_SEGMENTS}
            {smsMeta.segments > 0 ? ` | Per-segment limit: ${smsMeta.perSegmentLimit}` : ''}
            {!smsMeta.isWithinLimit ? ' | Exceeds allowed SMS segments' : ''}
          </small>
          
          {showPersonalizedGuide && (
            <div style={{ marginTop: '10px', backgroundColor: '#f7fbff', border: '1px solid #cfe8ff', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontWeight: 'bold', color: '#0d47a1', marginBottom: '6px' }}>
                Excel Placeholder Guide (for Upload Personalized SMS Excel)
              </div>
              <small style={{ display: 'block', color: '#1f2937', marginBottom: '4px' }}>
                Use commands like <strong>#1#</strong>, <strong>#2#</strong>, <strong>#3#</strong> to read columns from each Excel row.
              </small>
              <small style={{ display: 'block', color: '#1f2937', marginBottom: '4px' }}>
                <strong>Example Excel row:</strong> 91XXXXXXXXXX | Rahul | 1250 | 12-03-2026
              </small>
              <small style={{ display: 'block', color: '#1f2937', marginBottom: '4px' }}>
                <strong>Message template:</strong> Hi #2#, amount ₹#3# received on #4#.
              </small>
              <small style={{ display: 'block', color: '#1f2937' }}>
                <strong>Rendered SMS:</strong> Hi Rahul, amount ₹1250 received on 12-03-2026.
              </small>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px', border: '1px solid #eee', borderRadius: '8px', padding: '14px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Insert Short URL</label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <select
              value={selectedShortUrlId}
              onChange={(e) => setSelectedShortUrlId(e.target.value)}
              style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
            >
              <option value="">Select short URL</option>
              {shortUrls.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.link_name} - {item.short_url}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleInsertShortUrl} style={{ padding: '10px 12px', border: 'none', borderRadius: '6px', backgroundColor: '#1976d2', color: '#fff', cursor: 'pointer' }}>
              Insert Short URL
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Link Name"
              value={newLinkName}
              onChange={(e) => setNewLinkName(e.target.value)}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            <input
              type="url"
              placeholder="Redirect URL (https://...)"
              value={newRedirectUrl}
              onChange={(e) => setNewRedirectUrl(e.target.value)}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            <button type="button" disabled={creatingShortUrl} onClick={handleCreateShortUrl} style={{ padding: '10px 12px', border: 'none', borderRadius: '6px', backgroundColor: '#43a047', color: '#fff', cursor: 'pointer' }}>
              {creatingShortUrl ? 'Creating...' : 'Create'}
            </button>
          </div>

          <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '6px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee' }}>Link Name</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee' }}>Short URL</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee' }}>Redirect URL</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee' }}>Clicks</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee' }}>Last Click</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {shortUrls.map((item) => (
                  <tr
                    key={item.id}
                    onMouseEnter={() => setHoveredShortUrlId(String(item.id))}
                    onMouseLeave={() => setHoveredShortUrlId('')}
                  >
                    <td style={{ padding: '8px', borderBottom: '1px solid #f5f5f5' }}>{item.link_name}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f5f5f5' }}>{item.short_url}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f5f5f5' }}>{item.redirect_url}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f5f5f5' }}>{item.total_clicks || 0}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f5f5f5' }}>
                      {item.last_clicked_at ? new Date(item.last_clicked_at).toLocaleString() : '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f5f5f5', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteShortUrl(item.id)}
                        title="Delete"
                        style={{
                          opacity: hoveredShortUrlId === String(item.id) ? 1 : 0,
                          transition: 'opacity 0.2s',
                          border: 'none',
                          background: '#ef5350',
                          color: '#fff',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {sendMode === 'group' && (
          <div style={{ marginBottom: '20px', border: '1px solid #eee', borderRadius: '8px', padding: '14px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Select Group *
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '12px' }}
            >
              <option value="">Select group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.member_count} members)
                </option>
              ))}
            </select>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '12px' }}>
              <strong style={{ color: '#333' }}>Create Group</strong>
              <div style={{ marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '10px' }}
                />
                <textarea
                  value={newGroupMembers}
                  onChange={(e) => setNewGroupMembers(e.target.value)}
                  placeholder="One member per line. Format: Name,+919876543210 or +919876543210"
                  style={{ width: '100%', height: '90px', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', resize: 'none', marginBottom: '10px' }}
                />
                <button
                  type="button"
                  disabled={creatingGroup}
                  onClick={handleCreateGroup}
                  style={{ padding: '10px 12px', border: 'none', borderRadius: '6px', backgroundColor: '#6d4c41', color: '#fff', cursor: 'pointer' }}
                >
                  {creatingGroup ? 'Saving...' : 'Save Group'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '20px', border: '1px solid #eee', borderRadius: '8px', padding: '14px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
            Send Time *
          </label>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            <label>
              <input
                type="radio"
                name="delivery_mode"
                value="instant"
                checked={deliveryMode === 'instant'}
                onChange={() => setDeliveryMode('instant')}
                style={{ marginRight: '6px' }}
              />
              Instant
            </label>
            {!isSmppTransport && (
              <label>
                <input
                  type="radio"
                  name="delivery_mode"
                  value="scheduled"
                  checked={deliveryMode === 'scheduled'}
                  onChange={() => setDeliveryMode('scheduled')}
                  style={{ marginRight: '6px' }}
                />
                Schedule
              </label>
            )}
          </div>

          {isSmppTransport && (
            <small style={{ color: '#666', display: 'block', marginBottom: '8px' }}>
              SMPP sends are submitted immediately. Scheduling is available only for the normal SMS API route.
            </small>
          )}

          {deliveryMode === 'scheduled' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '8px', backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <input
                      type="text"
                      value={timezoneSearchInput}
                      onChange={(e) => setTimezoneSearchInput(e.target.value)}
                      placeholder="Type country, timezone, or UTC offset..."
                      style={{ width: '100%', padding: '7px 9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
                    />
                    {timezoneSearchInput && (
                      <button
                        type="button"
                        onClick={handleTimezoneSearchReset}
                        style={{ padding: '7px 10px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <select
                    value={timezoneName}
                    onChange={(e) => setTimezoneName(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                  >
                    {groupedTimezoneEntries.length === 0 ? (
                      <option value="" disabled>
                        No timezones match your search
                      </option>
                    ) : (
                      groupedTimezoneEntries.map(([country, zones]) => (
                        <optgroup key={country} label={country}>
                          {zones.map((zone) => (
                            <option key={zone.timezone_name} value={zone.timezone_name}>
                              {zone.display_label}
                            </option>
                          ))}
                        </optgroup>
                      ))
                    )}
                  </select>
                </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>
            </>
          )}
          {deliveryMode === 'scheduled' && (
            <small style={{ color: '#555', display: 'block', marginTop: '8px' }}>
              Selected timezone: {selectedTimezoneLabel} {timezonesLoading ? '(Loading...)' : ''}
              {timezoneSearchInput ? ` | Filter: "${timezoneSearchInput.trim()}"` : ''}
            </small>
          )}
        </div>

        <button
          type="button"
          onClick={handleSendSMS}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s',
          }}
        >
          {loading ? 'Processing...' : deliveryMode === 'scheduled' ? 'Schedule SMS' : isSmppTransport ? 'Send via SMPP' : 'Send SMS'}
        </button>
      </div>
    </div>
  );
}

