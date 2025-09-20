import { useState } from 'react';

export default function Business() {
  const [timezone, setTimezone] = useState('America/Edmonton');
  const [selectedServices, setSelectedServices] = useState([]);
  const [alert, setAlert] = useState(null);
  const [country, setCountry] = useState('Canada');
  const [province, setProvince] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [taxRate, setTaxRate] = useState('');

  const services = [
    'Construction',
    'Cleaning',
    'Landscaping',
    'Plumbing',
    'Electrical',
    'Snow Removal',
    'HVAC',
    'Roofing',
    'Handyman Services',
    'Flooring',
    'Windows & Doors',
    'Appliance Repair',
    'Moving Services',
    'Carpet Cleaning',
    'Pest Control',
  ];

  const provinces = {
    Canada: [
      'Alberta',
      'British Columbia',
      'Manitoba',
      'New Brunswick',
      'Newfoundland and Labrador',
      'Northwest Territories',
      'Nova Scotia',
      'Nunavut',
      'Ontario',
      'Prince Edward Island',
      'Quebec',
      'Saskatchewan',
      'Yukon',
    ],
    USA: [
      'Alabama',
      'Alaska',
      'Arizona',
      'Arkansas',
      'California',
      'Colorado',
      'Connecticut',
      'Delaware',
      'Florida',
      'Georgia',
      'Hawaii',
      'Idaho',
      'Illinois',
      'Indiana',
      'Iowa',
      'Kansas',
      'Kentucky',
      'Louisiana',
      'Maine',
      'Maryland',
      'Massachusetts',
      'Michigan',
      'Minnesota',
      'Mississippi',
      'Missouri',
      'Montana',
      'Nebraska',
      'Nevada',
      'New Hampshire',
      'New Jersey',
      'New Mexico',
      'New York',
      'North Carolina',
      'North Dakota',
      'Ohio',
      'Oklahoma',
      'Oregon',
      'Pennsylvania',
      'Rhode Island',
      'South Carolina',
      'South Dakota',
      'Tennessee',
      'Texas',
      'Utah',
      'Vermont',
      'Virginia',
      'Washington',
      'West Virginia',
      'Wisconsin',
      'Wyoming',
    ],
  };

  const toggleService = (service) => {
    setSelectedServices((prev) => (prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]));
    setAlert(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedServices.length === 0) {
      setAlert({
        type: 'danger',
        message: 'Please select at least one service.',
      });
      return;
    }

    setAlert({ type: 'success', message: 'Business saved successfully!' });
    console.log('Business saved with:', {
      timezone,
      selectedServices,
      country,
      province,
      taxNumber,
      taxRate,
    });
  };

  const timezones = [
    { value: 'America/St_Johns', label: 'Newfoundland Time (NT) - St. John’s' },
    { value: 'America/Halifax', label: 'Atlantic Time (AT) - Halifax' },
    { value: 'America/Glace_Bay', label: 'Atlantic Time (AT) - Glace Bay' },
    { value: 'America/Moncton', label: 'Atlantic Time (AT) - Moncton' },
    { value: 'America/Toronto', label: 'Eastern Time (ET) - Toronto' },
    { value: 'America/Montreal', label: 'Eastern Time (ET) - Montreal' },
    { value: 'America/New_York', label: 'Eastern Time (ET) - New York' },
    { value: 'America/Detroit', label: 'Eastern Time (ET) - Detroit' },
    { value: 'America/Chicago', label: 'Central Time (CT) - Chicago' },
    { value: 'America/Winnipeg', label: 'Central Time (CT) - Winnipeg' },
    { value: 'America/Regina', label: 'Central Time (CT) - Regina' },
    { value: 'America/Swift_Current', label: 'Central Time (CT) - Swift Current' },
    { value: 'America/Edmonton', label: 'Mountain Time (MT) - Edmonton' },
    { value: 'America/Denver', label: 'Mountain Time (MT) - Denver' },
    { value: 'America/Vancouver', label: 'Pacific Time (PT) - Vancouver' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT) - Los Angeles' },
    { value: 'America/Whitehorse', label: 'Pacific Time (PT) - Whitehorse' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT) - Anchorage' },
    { value: 'Pacific/Honolulu', label: 'Hawaii-Aleutian Time (HAT) - Honolulu' },
  ];

  return (
    <form className="tab-pane active" onSubmit={handleSubmit}>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}

      <div className="row">
        {/* Business Name */}
        <div className="mb-3 col-md-6">
          <div className="row">
            <label className="col-sm-4 col-form-label">Business Name (*)</label>
            <div className="col-sm-8">
              <input type="text" className="form-control" required />
            </div>
          </div>
        </div>

        {/* Business Email */}
        <div className="mb-3 col-md-6">
          <div className="row">
            <label className="col-sm-4 col-form-label">Business Email (*)</label>
            <div className="col-sm-8">
              <input type="email" className="form-control" required />
            </div>
          </div>
        </div>

        {/* Business Phone */}
        <div className="mb-3 col-md-6">
          <div className="row">
            <label className="col-sm-4 col-form-label">Business Phone (*)</label>
            <div className="col-sm-8">
              <input type="text" className="form-control" required />
            </div>
          </div>
        </div>

        {/* Timezone */}
        <div className="mb-3 col-md-6">
          <div className="row">
            <label className="col-sm-4 col-form-label">Timezone (*)</label>
            <div className="col-sm-8">
              <select className="form-select" value={timezone} onChange={(e) => setTimezone(e.target.value)} required>
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tax Number */}
        <div className="mb-3 col-md-6">
          <div className="row">
            <label className="col-sm-4 col-form-label">GST/HST Number (*)</label>
            <div className="col-sm-8">
              <input
                type="text"
                className="form-control"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tax Rate (%) */}
        <div className="mb-3 col-md-6">
          <div className="row">
            <label className="col-sm-4 col-form-label">Tax Rate % (*)</label>
            <div className="col-sm-8">
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Business Description */}
        <div className="mb-3 col-md-12">
          <div className="row">
            <label className="col-sm-2 col-form-label">Business Description (*)</label>
            <div className="col-sm-10">
              <textarea className="form-control" rows={3} required></textarea>
            </div>
          </div>
        </div>

        {/* Business Logo */}
        <div className="mb-3 col-md-6">
          <div className="row">
            <label className="col-sm-4 col-form-label">Business Logo</label>
            <div className="col-sm-8">
              <input type="file" className="form-control" />
            </div>
          </div>
        </div>

        <div className="mb-3 col-md-6">
          <div className="row">
            <label className="col-sm-4 col-form-label">Business Website</label>
            <div className="col-sm-8">
              <input type="url" className="form-control" />
            </div>
          </div>
        </div>
      </div>

      {/* Business Address */}
      <h5 className="mt-4">Business Address</h5>
      <div className="row">
        <div className="mb-3 col-md-4">
          <div className="row">
            <label className="col-sm-4 col-form-label">Street Address (*)</label>
            <div className="col-sm-8">
              <input type="text" className="form-control" required />
            </div>
          </div>
        </div>
        <div className="mb-3 col-md-4">
          <div className="row">
            <label className="col-sm-4 col-form-label">City (*)</label>
            <div className="col-sm-8">
              <input type="text" className="form-control" required />
            </div>
          </div>
        </div>
        <div className="mb-3 col-md-4">
          <div className="row">
            <label className="col-sm-4 col-form-label">Country (*)</label>
            <div className="col-sm-8">
              <select
                className="form-select"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setProvince('');
                }}
                required
              >
                <option value="Canada">Canada</option>
                <option value="USA">USA</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mb-3 col-md-4">
          <div className="row">
            <label className="col-sm-4 col-form-label">Province/State (*)</label>
            <div className="col-sm-8">
              <select className="form-select" value={province} onChange={(e) => setProvince(e.target.value)} required>
                <option value="">Select Province/State</option>
                {provinces[country].map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="mb-3 col-md-4">
          <div className="row">
            <label className="col-sm-4 col-form-label">Postal/ZIP Code (*)</label>
            <div className="col-sm-8">
              <input type="text" className="form-control" required />
            </div>
          </div>
        </div>
      </div>

      {/* Services Offered */}
      <h5 className="mt-4">Services Offered</h5>
      <div className="d-flex flex-wrap gap-2 mb-3">
        {services.map((service) => (
          <div
            key={service}
            className={`alert px-3 py-2 mb-0 ${
              selectedServices.includes(service) ? 'alert-success' : 'alert-secondary'
            }`}
            role="button"
            style={{ cursor: 'pointer' }}
            onClick={() => toggleService(service)}
          >
            {service}
          </div>
        ))}
      </div>

      <button className="btn btn-success">Save Business</button>
    </form>
  );
}
