// Mission content, sourced from KJS-SRS-01 (Use Case Profile, Dr. Umesh Shinde).

export const meta = {
  id: 'KJS-SRS-01',
  title: 'SomaiyaSat & SomaiyaPod',
  subtitle:
    'A PocketQube mission featuring autonomous AI-based inter-satellite data routing and advanced multi-mode amateur radio payloads',
  vertical: 'Space Technology and Remote Sensing',
  collaborator: 'ReOrbit, Finland',
  beneficiaries: 'Global amateur radio (HAM) community',
  owners: [
    {
      name: 'Dr. Umesh Shinde',
      role: 'Associate Professor, Basic Science and Humanities',
      org: 'K J Somaiya Institute of Technology',
    },
    {
      name: 'Dr. Shailesh Nikam',
      role: 'Professor, Mechanical Engineering',
      org: 'K J Somaiya School of Engineering',
    },
  ],
};

export const stats = [
  { value: '5 cm', label: 'PocketQube unit' },
  { value: '< 1 W', label: 'Average power budget' },
  { value: '4', label: 'Multiplexed RF modes' },
  { value: 'LEO', label: 'Short pass windows' },
];

export const problem = {
  statement: `Small satellites such as PocketQubes have very limited power, size, communication bandwidth, and onboard computing capability. These limitations make it challenging to ensure reliable communication, confirm successful deployment, and manage multiple payload operations using traditional manual control methods.`,
  detail: `SomaiyaSat, the PocketQube satellite, is deployed into orbit using SomaiyaPod, a dedicated deployer. An intelligent and autonomous system is required to verify successful deployment, manage the transition from deployer to satellite operations, and efficiently transmit telemetry, payload and amateur radio data to ground stations — while supporting M17 digital voice, Codec2 voice, SSTV image transmission and TT&C data within limited communication opportunities and a restricted power budget.`,
  background: `PocketQubes are a new generation of ultra-small satellites, typically built around a 5 cm cube unit, widely used in educational, research and amateur satellite missions because they are cost-effective and quick to develop. After deployment, confirmation signals such as separation switches, timers or short-range communication links verify successful release and activate SomaiyaSat's onboard systems. Managing several communication modes over a limited radio link, particularly during the short windows available in Low Earth Orbit, requires intelligent and autonomous decision-making.`,
};

export const objectives = [
  {
    title: 'Qualify the SomaiyaPod deployer',
    body: 'Develop, qualify and validate the deployer system by demonstrating safe satellite deployment, reliable deployment confirmation, and successful post-deployment spacecraft initialization in accordance with mission requirements.',
  },
  {
    title: 'Autonomous onboard operations',
    body: 'Design, develop and validate a PocketQube capable of autonomous mission operations through onboard AI-based decision-making for data prioritization, communication management and resource allocation under varying link, power and operational conditions.',
  },
  {
    title: 'Shared amateur radio architecture',
    body: 'Demonstrate reliable amateur radio services through a shared communication architecture supporting telemetry, telecommand, digital voice and SSTV image transmission between the spacecraft and ground stations.',
  },
  {
    title: 'Verify survivability end to end',
    body: 'Verify functionality, reliability and survivability through environmental qualification, system integration, communication validation and end-to-end mission operations testing.',
  },
  {
    title: 'A student-led research platform',
    body: 'Establish a multidisciplinary platform for student-led research in artificial intelligence, embedded systems, RF and satellite communications, aerospace engineering, mechanical design and space mission operations.',
  },
];

export const solution = [
  {
    tag: 'Deployer',
    title: 'SomaiyaPod',
    body: 'Houses SomaiyaSat through launch ascent and executes a controlled release at the planned orbital insertion point, sending a deployment-confirmation signal — via separation switch or short-duration RF beacon — that SomaiyaSat uses to initialize its onboard systems and begin commissioning.',
  },
  {
    tag: 'Autonomy',
    title: 'AI scheduler / router',
    body: 'Running on a low-power microcontroller or SoC, it ingests link-quality estimates, battery and power telemetry, and a prioritized queue of pending data, then dynamically decides transmission order and mode switching to maximise successful delivery within each ground pass.',
  },
  {
    tag: 'Payload',
    title: 'Multi-mode RF stack',
    body: 'Implements M17 and Codec2 for digital voice and data, SSTV encoding for image downlink, and a dedicated TT&C/housekeeping channel — all multiplexed under the AI router’s control on shared RF front-end hardware.',
  },
  {
    tag: 'Models',
    title: 'Lightweight by design',
    body: 'Decision trees, small neural networks or reinforcement-learning policies trained on simulated link and power scenarios, sized to run reliably within PocketQube-class compute and sub-1 W average power budgets.',
  },
];

export const modes = [
  {
    id: 'ttc',
    name: 'TT&C / Housekeeping',
    priority: 'Highest',
    color: 'text-amber-400',
    ring: 'border-amber-500/40',
    dot: 'bg-amber-400',
    rate: '1.2 kbps',
    floor: '1.0 dB',
    body: 'Telemetry, tracking and command. Spacecraft health, bus voltages, temperatures and mode state. Always the highest-priority queue class, and the only traffic permitted in safe mode.',
  },
  {
    id: 'sstv',
    name: 'SSTV Image Downlink',
    priority: 'Second',
    color: 'text-emerald-400',
    ring: 'border-emerald-500/40',
    dot: 'bg-emerald-400',
    rate: '16 kbps',
    floor: '9.0 dB',
    body: 'Slow-scan television frames captured by the onboard camera. Bandwidth-heavy, so the router holds them for the high-elevation part of a pass where the link margin can carry them.',
  },
  {
    id: 'm17',
    name: 'M17 Voice / Data',
    priority: 'Third',
    color: 'text-violet-400',
    ring: 'border-violet-500/40',
    dot: 'bg-violet-400',
    rate: '9.6 kbps',
    floor: '6.0 dB',
    body: 'Open-source digital voice and data protocol for the amateur service. Carries repeater-style traffic for the global HAM community when link and power allow.',
  },
  {
    id: 'codec2',
    name: 'Codec2 Digital Voice',
    priority: 'Third',
    color: 'text-sky-400',
    ring: 'border-sky-500/40',
    dot: 'bg-sky-400',
    rate: '3.2 kbps',
    floor: '4.0 dB',
    body: 'Very low-bitrate speech codec, robust at poor SNR. Useful at low elevation when higher-rate modes cannot close the link.',
  },
];

export const challenges = [
  'Fail-safe deployment of SomaiyaSat from SomaiyaPod, including confirmation signalling and contingency handling if deployment is delayed or partial.',
  'AI/ML models compact and efficient enough to run within PocketQube-class power (often sub-1 W average) and compute budgets.',
  'Balancing real-time TT&C against bandwidth-heavy SSTV imagery and voice traffic under unpredictable link conditions.',
  'Verifying autonomous routing decisions are safe and fail gracefully — the satellite must never lose contact due to a scheduling error.',
  'Validating multi-mode radio payload switching without access to a live orbital environment before launch.',
  'Managing thermal, power and structural constraints of the PocketQube form factor, plus a deployer that survives launch loads and releases cleanly.',
  'Coordinating regulatory and amateur radio licensing requirements for the multi-mode payloads.',
];

export const outputs = [
  'A working PocketQube-class satellite released by its purpose-built deployer, demonstrating reliable deployment confirmation and AI-driven autonomous data routing.',
  'A validated multi-mode amateur radio payload supporting M17, Codec2, SSTV and TT&C/housekeeping.',
  'Onboard AI models suitable for resource-constrained space platforms.',
  'Ground station software for multi-mode reception and decoding.',
  'Documented performance results — deployment success rate, link success rates, data prioritization accuracy, power efficiency — usable for publication and as a template for future student-built missions.',
];

export const workflow = [
  {
    key: 'A',
    title: 'Mission requirements & interface definition',
    items: [
      'Define mission requirements for the SomaiyaSat–SomaiyaPod system and specify the deployer/satellite interface.',
      'Define mission concept, objectives and success criteria; prepare interface control documents (ICDs).',
      'Perform mission analysis and system design using STK and GMAT for orbit design, access analysis and link budgeting.',
    ],
  },
  {
    key: 'B',
    title: 'AI model design & training',
    items: [
      'Design AI models for autonomous data routing and prioritization.',
      'Train on simulated link-quality, power and data-priority scenarios.',
      'Build lightweight, onboard-compatible models within PocketQube power, memory and compute budgets.',
    ],
  },
  {
    key: 'C',
    title: 'Payload & deployer development (parallel track)',
    items: [
      'SomaiyaSat: RF transceivers, antennas, OBC, power ICs and camera selection; per-mode firmware then unified stack.',
      'Bench-test each radio mode for encoding, signal integrity and power draw; integration-test for resource conflicts.',
      'SomaiyaPod: release mechanism, separation switches and timer electronics; jam-free actuation and vibration/TVAC testing.',
      'Full deployment rehearsals with a mass simulant to confirm clean separation and confirmation-signal receipt.',
    ],
  },
  {
    key: 'D',
    title: 'AI deployment & hardware-in-the-loop',
    items: [
      'Deploy the routing model onto the flight computer.',
      'Test via hardware-in-the-loop simulation emulating post-deployment commissioning and ground-link conditions.',
    ],
  },
  {
    key: 'E',
    title: 'Ground station development',
    items: ['Develop ground station software to receive, decode and visualize multi-mode downlinked data.'],
  },
  {
    key: 'F',
    title: 'Integrated testing & demonstration',
    items: [
      'Integrated system testing and environmental qualification, including deployer release testing.',
      'Ground / balloon / orbital demonstration validating end-to-end autonomous operation.',
      'ETL qualification: EMI/EMC, thermal vacuum and vibration testing.',
      'Mission documentation and launch-readiness reports for qualification, regulatory compliance and launch approval.',
    ],
  },
];

export const governance = [
  {
    area: 'Privacy & Data Protection',
    level: 'Low',
    note: 'Mission data is non-personal; amateur transmissions stay open-access while ground-station credentials and command links are protected by encryption and authentication.',
  },
  {
    area: 'AI Security & Trustworthiness',
    level: 'High',
    note: 'Onboard routing decisions must be verifiable and fail-safe, with watchdogs and rule-based fallback logic when model output is anomalous.',
  },
  {
    area: 'Responsible AI',
    level: 'Medium',
    note: 'Decision logic is explainable to the ground team — every prioritization choice is logged with its rationale.',
  },
  {
    area: 'Generative AI / LLMs',
    level: 'Low',
    note: 'Not core to onboard operation; may support ground-segment tooling such as automated report generation from telemetry logs.',
  },
  {
    area: 'Agentic AI',
    level: 'High',
    note: 'The onboard router acts as an autonomous agent making real-time scheduling decisions with no human in the loop during a pass.',
  },
  {
    area: 'Human-in-the-Loop',
    level: 'Medium',
    note: 'Ground operators retain command override; autonomy is bounded by uplinked commands and safe-mode triggers.',
  },
  {
    area: 'Regulatory / Governance',
    level: 'High',
    note: 'Amateur frequency allocation and licensing (ITU / national HAM regulation) and PocketQube launch registration must be addressed early.',
  },
];

export const domains = [
  {
    programs: 'CE, IT, AI&DS',
    domain: 'AI/ML Model Development',
    layer: 'Software',
    role: 'Design and training of onboard data-routing and prioritization models.',
    deps: 'Receives link-quality and power telemetry from EXTC; provides decisions to the embedded firmware team.',
  },
  {
    programs: 'EXTC, ECE',
    domain: 'RF Communications & Payload Design',
    layer: 'Hardware / Firmware',
    role: 'Implementation of M17, Codec2, SSTV and TT&C radio modules.',
    deps: 'Supplies signal and link data to the AI router; depends on the power budget from Mechanical.',
  },
  {
    programs: 'MECH, RAI',
    domain: 'Structural & Thermal Design',
    layer: 'Hardware',
    role: 'PocketQube chassis, thermal management and mechanical integration.',
    deps: 'Constrains power and volume available to electronics and AI compute hardware.',
  },
  {
    programs: 'CSE',
    domain: 'Embedded Systems & Flight Software',
    layer: 'Software / Firmware',
    role: 'Deployment of AI models on the flight computer and system integration.',
    deps: 'Integrates AI and EXTC outputs into a unified onboard control loop.',
  },
];

export const programs = {
  KJSIT: [
    { name: 'Information Technology', mapped: true },
    { name: 'Computer Engineering', mapped: true },
    { name: 'Artificial Intelligence & Data Science', mapped: true },
    { name: 'Electronics and Telecommunication', mapped: true },
  ],
  KJSSE: [
    { name: 'Information Technology', mapped: true },
    { name: 'Computer Engineering', mapped: true },
    { name: 'Artificial Intelligence & Data Science', mapped: true },
    { name: 'Electronics & Telecommunication Engineering', mapped: true },
    { name: 'Computer & Communication Engineering', mapped: true },
    { name: 'Electronics & Computer Engineering', mapped: true },
    { name: 'Electronics Engineering (VLSI Design & Technology)', mapped: false },
    { name: 'Computer Science & Business Systems', mapped: true },
    { name: 'Mechanical Engineering', mapped: true },
    { name: 'Robotics & Artificial Intelligence', mapped: true },
  ],
};
