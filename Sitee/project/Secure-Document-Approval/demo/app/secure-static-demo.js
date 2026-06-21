/* Static SecureDoc demo adapter generated for Joseph Doyle-Samadi portfolio. */
(() => {
  const ORIGINAL_FETCH = window.fetch.bind(window);
  const STORAGE_KEY = 'securedoc_static_db_v1';
  const SESSION_KEY = 'securedoc_static_sessions_v1';
  const SEED_DB = {"users":[{"id":"usr_submitter","name":"Joseph Doyle-Samadi","email":"employee@demo.com","role":"submitter","department":"Education Operations","avatar":"JD"},{"id":"usr_reviewer","name":"Maya Chen","email":"reviewer@demo.com","role":"reviewer","department":"Review Office","avatar":"MC"},{"id":"usr_admin","name":"Alex Morgan","email":"admin@demo.com","role":"admin","department":"Security & Compliance","avatar":"AM"},{"id":"usr_reviewer_two","name":"Sarah Patel","email":"sarah.reviewer@demo.com","role":"reviewer","department":"Legal Review","avatar":"SP"},{"id":"usr_employee_two","name":"Daniel Brooks","email":"daniel.employee@demo.com","role":"submitter","department":"Finance","avatar":"DB"}],"documents":[{"id":"doc_employment_contract","title":"Employment Contract","category":"HR","department":"Education Operations","confidentiality":"Restricted","status":"pending","ownerId":"usr_submitter","assignedTo":"usr_reviewer","dueDate":"2026-06-24","version":2,"fileName":"Employment Contract.pdf","storageName":null,"fileSize":482910,"mimeType":"application/pdf","hash":"87f38f12a9b0b30ed2e6248bb4820c7b146df7ab59cd6b13e7e49e8f8237ef21","submittedAt":"2026-06-18T09:12:00.000Z","approvedAt":null,"rejectionReason":"","notes":"Needs final reviewer approval before the employment package can be marked complete.","comments":[{"id":"cmt_1","userId":"usr_reviewer","body":"Checking signature block, start date, and compensation terms.","createdAt":"2026-06-18T10:05:00.000Z"}],"createdAt":"2026-06-18T09:00:00.000Z","updatedAt":"2026-06-18T10:05:00.000Z","versions":[]},{"id":"doc_student_verification","title":"Student Verification Form","category":"Education","department":"Education Operations","confidentiality":"Confidential","status":"approved","ownerId":"usr_submitter","assignedTo":"usr_reviewer","dueDate":"2026-06-20","version":1,"fileName":"Student Verification Form.pdf","storageName":null,"fileSize":188440,"mimeType":"application/pdf","hash":"43b3752e27b5827b70d412099f2ce65016f6d476eb9f3954acc7d968b3e7cd6d","submittedAt":"2026-06-16T11:05:00.000Z","approvedAt":"2026-06-16T15:25:00.000Z","rejectionReason":"","notes":"Approved verification package for onboarding evidence.","comments":[{"id":"cmt_2","userId":"usr_reviewer","body":"Approved. Form matches required verification details.","createdAt":"2026-06-16T15:25:00.000Z"}],"createdAt":"2026-06-16T10:55:00.000Z","updatedAt":"2026-06-16T15:25:00.000Z","versions":[],"approvalReceipt":{"id":"rcpt_student_verification","hash":"43b3752e27b5827b70d412099f2ce65016f6d476eb9f3954acc7d968b3e7cd6d","approvedAt":"2026-06-16T15:25:00.000Z","approvedById":"usr_reviewer"}},{"id":"doc_vendor_agreement","title":"Vendor Agreement","category":"Legal","department":"Operations","confidentiality":"Restricted","status":"pending","ownerId":"usr_employee_two","assignedTo":"usr_reviewer_two","dueDate":"2026-06-25","version":3,"fileName":"Vendor Agreement.pdf","storageName":null,"fileSize":521904,"mimeType":"application/pdf","hash":"c5c5931ff5a678e9625d3c1d74f56125c157e18d1c0be222b3c50eb5c5bb11ff","submittedAt":"2026-06-18T13:30:00.000Z","approvedAt":null,"rejectionReason":"","notes":"Renewal agreement requires legal review before signature.","comments":[],"createdAt":"2026-06-18T13:12:00.000Z","updatedAt":"2026-06-18T13:30:00.000Z","versions":[]},{"id":"doc_policy_update","title":"Policy Update","category":"Compliance","department":"People","confidentiality":"Internal","status":"changes_requested","ownerId":"usr_submitter","assignedTo":"usr_reviewer","dueDate":"2026-06-21","version":2,"fileName":"Policy Update.docx","storageName":null,"fileSize":231804,"mimeType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","hash":"9436e84eb66b814d54409d39fd4710c116590a4c84439a40dd853711d0a0a10a","submittedAt":"2026-06-17T14:20:00.000Z","approvedAt":null,"rejectionReason":"Clarify who can approve exceptions and add a review date before resubmitting.","notes":"Updated internal policy after leadership review.","comments":[{"id":"cmt_3","userId":"usr_reviewer","body":"Please tighten the exception approval wording.","createdAt":"2026-06-17T16:40:00.000Z"}],"createdAt":"2026-06-17T13:50:00.000Z","updatedAt":"2026-06-17T16:40:00.000Z","versions":[]},{"id":"doc_transcript_request","title":"Transcript Request","category":"Education","department":"Education Operations","confidentiality":"Confidential","status":"draft","ownerId":"usr_submitter","assignedTo":"usr_reviewer","dueDate":"2026-06-28","version":1,"fileName":"Transcript Request.pdf","storageName":null,"fileSize":91022,"mimeType":"application/pdf","hash":"58ad2e0b8e542720fa08798a517969adf8856c4c9b305b820bdad0a1232b4012","submittedAt":null,"approvedAt":null,"rejectionReason":"","notes":"Draft saved by submitter. Not visible in reviewer queue until submitted.","comments":[],"createdAt":"2026-06-18T12:15:00.000Z","updatedAt":"2026-06-18T12:15:00.000Z","versions":[]},{"id":"doc_onboarding_checklist","title":"Onboarding Checklist","category":"HR","department":"People","confidentiality":"Internal","status":"approved","ownerId":"usr_employee_two","assignedTo":"usr_reviewer_two","dueDate":"2026-06-18","version":1,"fileName":"Onboarding Checklist.pdf","storageName":null,"fileSize":160204,"mimeType":"application/pdf","hash":"7c01509ae23747f6172332fc3cb648bb49f08a5bdf9c8d71e52bd17a310bf235","submittedAt":"2026-06-15T09:45:00.000Z","approvedAt":"2026-06-15T12:10:00.000Z","rejectionReason":"","notes":"Checklist verified and stored for onboarding evidence.","comments":[{"id":"cmt_4","userId":"usr_reviewer_two","body":"Approved. All required onboarding items are present.","createdAt":"2026-06-15T12:10:00.000Z"}],"createdAt":"2026-06-15T09:20:00.000Z","updatedAt":"2026-06-15T12:10:00.000Z","versions":[],"approvalReceipt":{"id":"rcpt_onboarding_checklist","hash":"7c01509ae23747f6172332fc3cb648bb49f08a5bdf9c8d71e52bd17a310bf235","approvedAt":"2026-06-15T12:10:00.000Z","approvedById":"usr_reviewer_two"}},{"id":"doc_insurance_confirmation","title":"Insurance Confirmation","category":"Finance","department":"Finance","confidentiality":"Confidential","status":"rejected","ownerId":"usr_employee_two","assignedTo":"usr_reviewer","dueDate":"2026-06-19","version":1,"fileName":"Insurance Confirmation.pdf","storageName":null,"fileSize":204991,"mimeType":"application/pdf","hash":"bed1ecab7fb3be87317aee0b4dc41d8a91f35f47d66a5a975c89c7e82249d2f1","submittedAt":"2026-06-14T13:15:00.000Z","approvedAt":null,"rejectionReason":"Document is missing the policy number and coverage period.","notes":"Needs corrected supporting evidence before it can be accepted.","comments":[{"id":"cmt_5","userId":"usr_reviewer","body":"Rejected until the missing policy information is included.","createdAt":"2026-06-14T16:05:00.000Z"}],"createdAt":"2026-06-14T13:00:00.000Z","updatedAt":"2026-06-14T16:05:00.000Z","versions":[]}],"audit":[{"id":"aud_a03d062a2024734d","documentId":null,"actorId":"usr_submitter","action":"login","ip":"::1","createdAt":"2026-06-19T23:30:54.824Z","details":"Joseph Doyle-Samadi logged in as Employee / Submitter.","status":"success","actorRole":"submitter","previousHash":"GENESIS","eventHash":"858bbcd439204523c6c2eb8200d745fa8b39a575068c47e6dcc8a9a2a4680406"},{"id":"aud_70eb0022c52f8230","documentId":null,"actorId":"usr_admin","action":"login","ip":"::1","createdAt":"2026-06-19T21:10:58.325Z","details":"Alex Morgan logged in as System Admin.","status":"success","actorRole":"admin","previousHash":"858bbcd439204523c6c2eb8200d745fa8b39a575068c47e6dcc8a9a2a4680406","eventHash":"35900ae8d37221892df71b32deb777ab7eb2bb6ce75e4abb318ec1d6fc0cd65b"},{"id":"aud_001","documentId":"doc_employment_contract","actorId":"usr_submitter","action":"submitted_document","ip":"127.0.0.1","createdAt":"2026-06-18T09:12:00.000Z","details":"Submitted Employment Contract for approval.","status":"success","actorRole":"submitter","previousHash":"35900ae8d37221892df71b32deb777ab7eb2bb6ce75e4abb318ec1d6fc0cd65b","eventHash":"e6a8aeda918d2dede3e9bf0e9423cf38146667286e1108c2251aaccc916b78d6"},{"id":"aud_002","documentId":"doc_employment_contract","actorId":"usr_reviewer","action":"commented","ip":"127.0.0.1","createdAt":"2026-06-18T10:05:00.000Z","details":"Added review comment.","status":"success","actorRole":"reviewer","previousHash":"e6a8aeda918d2dede3e9bf0e9423cf38146667286e1108c2251aaccc916b78d6","eventHash":"0e9b550bc9282c0a30e83cc1de19202f19e81ddcb1db747c5b291ff8c3b6f64b"},{"id":"aud_003","documentId":"doc_policy_update","actorId":"usr_reviewer","action":"requested_changes","ip":"127.0.0.1","createdAt":"2026-06-17T16:40:00.000Z","details":"Requested changes before approval. Hash: 9436e84eb66b...","status":"success","actorRole":"reviewer","previousHash":"0e9b550bc9282c0a30e83cc1de19202f19e81ddcb1db747c5b291ff8c3b6f64b","eventHash":"372e135fa0e81fd2aafff983ace9e93a470d777e84a491b340d8f0ac4ec1a1ed"},{"id":"aud_004","documentId":"doc_student_verification","actorId":"usr_reviewer","action":"approved_document","ip":"127.0.0.1","createdAt":"2026-06-16T15:25:00.000Z","details":"Approved document and generated approval receipt. Hash: 43b3752e27b5...","status":"success","actorRole":"reviewer","previousHash":"372e135fa0e81fd2aafff983ace9e93a470d777e84a491b340d8f0ac4ec1a1ed","eventHash":"d665678796ecf2be8e945a5f966f4954f3b4fa6b43b1e83267cad4503599a148"},{"id":"aud_005","documentId":"doc_vendor_agreement","actorId":"usr_employee_two","action":"uploaded_and_submitted","ip":"127.0.0.1","createdAt":"2026-06-18T13:30:00.000Z","details":"Uploaded and submitted Vendor Agreement.","status":"success","actorRole":"submitter","previousHash":"d665678796ecf2be8e945a5f966f4954f3b4fa6b43b1e83267cad4503599a148","eventHash":"5d771f2e5c181d52b955a131a7d3233b233b9933e79c1754f659f61341f8b04e"},{"id":"aud_006","documentId":"doc_insurance_confirmation","actorId":"usr_reviewer","action":"rejected_document","ip":"127.0.0.1","createdAt":"2026-06-14T16:05:00.000Z","details":"Rejected document. Hash: bed1ecab7fb3...","status":"success","actorRole":"reviewer","previousHash":"5d771f2e5c181d52b955a131a7d3233b233b9933e79c1754f659f61341f8b04e","eventHash":"25ef18fe1e06c31ea9217bc0e98e514210023ecec1a8308b462ff8cfaf49eee6"},{"id":"aud_b4bfd8b6b8c78545","documentId":null,"actorId":"usr_admin","actorRole":"admin","action":"login","status":"success","details":"Alex Morgan logged in as System Admin. Demo-only credentials were used.","ip":"::1","createdAt":"2026-06-20T02:38:10.271Z","previousHash":"25ef18fe1e06c31ea9217bc0e98e514210023ecec1a8308b462ff8cfaf49eee6","eventHash":"36fda3349c8572d1e4bfca8f75a514485bf2cf3e32b6faa21dc6910765ac93b5"},{"id":"aud_3ffc63637c6c9177","documentId":null,"actorId":"usr_submitter","actorRole":"submitter","action":"login","status":"success","details":"Joseph Doyle-Samadi logged in as Employee / Submitter. Demo-only credentials were used.","ip":"::1","createdAt":"2026-06-20T02:38:31.740Z","previousHash":"36fda3349c8572d1e4bfca8f75a514485bf2cf3e32b6faa21dc6910765ac93b5","eventHash":"f27bd409e4b44523592094efef2eba91ac1e51759d590a9a8bc9a63ee51d58ca"},{"id":"aud_abae22ba55a80250","documentId":null,"actorId":"usr_submitter","actorRole":"submitter","action":"login","status":"success","details":"Joseph Doyle-Samadi logged in as Employee / Submitter. Demo-only credentials were used.","ip":"::1","createdAt":"2026-06-20T04:09:58.871Z","previousHash":"f27bd409e4b44523592094efef2eba91ac1e51759d590a9a8bc9a63ee51d58ca","eventHash":"fd83d7bf35c128c08c5d153f91f455a5201b953f071a12afeef5e4cd2722305d"},{"id":"aud_d661784300add22b","documentId":null,"actorId":"usr_reviewer","actorRole":"reviewer","action":"login","status":"success","details":"Maya Chen logged in as Reviewer / Manager. Demo-only credentials were used.","ip":"::1","createdAt":"2026-06-20T04:09:58.922Z","previousHash":"fd83d7bf35c128c08c5d153f91f455a5201b953f071a12afeef5e4cd2722305d","eventHash":"f49a8fe89d326f2b05dece6ca35a27898604535c3a29a72f9ecbc6666d5e61c7"},{"id":"aud_7fad656ab6f0fbbb","documentId":null,"actorId":"usr_admin","actorRole":"admin","action":"login","status":"success","details":"Alex Morgan logged in as System Admin. Demo-only credentials were used.","ip":"::1","createdAt":"2026-06-20T04:09:58.966Z","previousHash":"f49a8fe89d326f2b05dece6ca35a27898604535c3a29a72f9ecbc6666d5e61c7","eventHash":"442e1fcda150a3e87b360d9f2e9a5a5511d56bb687921c0834883ef03338d871"},{"id":"aud_fa33e58dc0371111","documentId":null,"actorId":"usr_reviewer","actorRole":"reviewer","action":"login","status":"success","details":"Maya Chen logged in as Reviewer / Manager. Demo-only credentials were used.","ip":"::1","createdAt":"2026-06-20T04:10:10.410Z","previousHash":"442e1fcda150a3e87b360d9f2e9a5a5511d56bb687921c0834883ef03338d871","eventHash":"bf5140cbe7702d5dbf87619a8369c8dc4927aeaac376b1d3dde7688fbf01feac"},{"id":"aud_755a342534ebd5c7","documentId":null,"actorId":null,"actorRole":"anonymous","action":"failed_login","status":"failed","details":"Failed login attempt for nobody@test.com.","ip":"::1","createdAt":"2026-06-20T04:10:10.458Z","previousHash":"bf5140cbe7702d5dbf87619a8369c8dc4927aeaac376b1d3dde7688fbf01feac","eventHash":"43b505e5d128b89cbcbe49dcffb41f6acd543984eb115309976688a8b924ae57"},{"id":"aud_6e5c6dd8a96e90a8","documentId":null,"actorId":null,"actorRole":"anonymous","action":"failed_login","status":"failed","details":"Failed login attempt for nobody@test.com.","ip":"::1","createdAt":"2026-06-20T04:10:10.464Z","previousHash":"43b505e5d128b89cbcbe49dcffb41f6acd543984eb115309976688a8b924ae57","eventHash":"11400c583df85a57aa74bfecdf38072aa10f3cec36b5401d9f2eb62debc8a9df"},{"id":"aud_a6f613eda19d86ae","documentId":null,"actorId":null,"actorRole":"anonymous","action":"failed_login","status":"failed","details":"Failed login attempt for nobody@test.com.","ip":"::1","createdAt":"2026-06-20T04:10:10.469Z","previousHash":"11400c583df85a57aa74bfecdf38072aa10f3cec36b5401d9f2eb62debc8a9df","eventHash":"348773c88dc40ad850a7c8e930e918c99d60a01483bfedb5ef2e9f8cdc11555e"},{"id":"aud_dac36b20467563f5","documentId":null,"actorId":null,"actorRole":"anonymous","action":"failed_login","status":"failed","details":"Failed login attempt for nobody@test.com.","ip":"::1","createdAt":"2026-06-20T04:10:10.474Z","previousHash":"348773c88dc40ad850a7c8e930e918c99d60a01483bfedb5ef2e9f8cdc11555e","eventHash":"a6d764041921da3a0dc4ed70ff0734d34298837e4fa7cb9c0c2890287fd1b8cb"},{"id":"aud_112db8f8d45a8f9e","documentId":null,"actorId":null,"actorRole":"anonymous","action":"failed_login","status":"failed","details":"Failed login attempt for nobody@test.com.","ip":"::1","createdAt":"2026-06-20T04:10:10.480Z","previousHash":"a6d764041921da3a0dc4ed70ff0734d34298837e4fa7cb9c0c2890287fd1b8cb","eventHash":"9e1efd79e91b4f99e98e1bfd38ffa0134b36e30f6376f7cb229588cddc48bcbd"},{"id":"aud_21e2a3cfffa1d8a5","documentId":null,"actorId":null,"actorRole":"anonymous","action":"failed_login","status":"blocked","details":"Rate-limited login attempt for nobody@test.com.","ip":"::1","createdAt":"2026-06-20T04:10:10.486Z","previousHash":"9e1efd79e91b4f99e98e1bfd38ffa0134b36e30f6376f7cb229588cddc48bcbd","eventHash":"aeaf7c5a6562ddb3231f1c1cbc5bbf24fea0a91433663eb00bad89d11be4ebd8"},{"id":"aud_47ffc46560d726fc","documentId":null,"actorId":"usr_submitter","actorRole":"submitter","action":"login","status":"success","details":"Joseph Doyle-Samadi logged in as Employee / Submitter. Demo-only credentials were used.","ip":"::1","createdAt":"2026-06-20T04:11:53.025Z","previousHash":"aeaf7c5a6562ddb3231f1c1cbc5bbf24fea0a91433663eb00bad89d11be4ebd8","eventHash":"0eb32bcb055c15fc571fc0e30ce3d47701491bf383833dbe8fa71f6864a1803c"},{"id":"aud_4a4885591d1f37aa","documentId":null,"actorId":"usr_submitter","actorRole":"submitter","action":"logout","status":"success","details":"Joseph Doyle-Samadi logged out.","ip":"::1","createdAt":"2026-06-20T04:12:05.787Z","previousHash":"0eb32bcb055c15fc571fc0e30ce3d47701491bf383833dbe8fa71f6864a1803c","eventHash":"70a2c1ab3ebc4776dbe909acbe1efcfdb26389b269b85e870f940dcb7aed0afb"},{"id":"aud_9baccc6d1f811f90","documentId":null,"actorId":"usr_submitter","actorRole":"submitter","action":"login","status":"success","details":"Joseph Doyle-Samadi logged in as Employee / Submitter. Demo-only credentials were used.","ip":"::1","createdAt":"2026-06-20T04:19:05.316Z","previousHash":"70a2c1ab3ebc4776dbe909acbe1efcfdb26389b269b85e870f940dcb7aed0afb","eventHash":"800377396f8a31ecfd423df7aa9598e6bc51a698b6b061c8861c70616c798e00"},{"id":"aud_0de6a756d1eb1cbb","documentId":null,"actorId":"usr_submitter","actorRole":"submitter","action":"login","status":"success","details":"Joseph Doyle-Samadi logged in as Employee / Submitter. Demo-only credentials were used.","ip":"::1","createdAt":"2026-06-20T05:16:58.775Z","previousHash":"800377396f8a31ecfd423df7aa9598e6bc51a698b6b061c8861c70616c798e00","eventHash":"f99869cb0948e3c93b0ee7b97cb55194ac3764159abe177eed104e9ff3a8dc1b"},{"id":"aud_1a079cbcb8c187c3","documentId":null,"actorId":"usr_reviewer","actorRole":"reviewer","action":"login","status":"success","details":"Maya Chen logged in as Reviewer / Manager. Demo-only credentials were used.","ip":"::1","createdAt":"2026-06-20T15:09:41.229Z","previousHash":"f99869cb0948e3c93b0ee7b97cb55194ac3764159abe177eed104e9ff3a8dc1b","eventHash":"1fc5714459942fabbb80a672fdb42d248d715009317209e096b75ce9af3a8060"},{"id":"aud_a67b16e1a3c749b3","documentId":null,"actorId":"usr_reviewer","actorRole":"reviewer","action":"logout","status":"success","details":"Maya Chen logged out.","ip":"::1","createdAt":"2026-06-20T15:09:45.439Z","previousHash":"1fc5714459942fabbb80a672fdb42d248d715009317209e096b75ce9af3a8060","eventHash":"68ef4574f3f0a99bf42bf77c26bd14645709094724811117967cea160fa58fcd"},{"id":"aud_ff668db7a58648af","documentId":null,"actorId":"usr_reviewer","actorRole":"reviewer","action":"login","status":"success","details":"Maya Chen logged in as Reviewer / Manager. Demo-only credentials were used.","ip":"::1","createdAt":"2026-06-20T15:10:05.910Z","previousHash":"68ef4574f3f0a99bf42bf77c26bd14645709094724811117967cea160fa58fcd","eventHash":"8f958375ec68f37e15a12421d167951cc4efcf751979fb3fdf7e81a8c45a41c1"},{"id":"aud_5f26d5376b2d45b0","documentId":null,"actorId":"usr_admin","actorRole":"admin","action":"login","status":"success","details":"Alex Morgan logged in as System Admin. Demo-only credentials were used.","ip":"127.0.0.1","createdAt":"2026-06-20T17:07:41.364Z","previousHash":"8f958375ec68f37e15a12421d167951cc4efcf751979fb3fdf7e81a8c45a41c1","eventHash":"b72b1586baed2acff43b17c5e7a5795029f5f2014be732d0899aa546669c4200"},{"id":"aud_25a929138d216591","documentId":null,"actorId":"usr_admin","actorRole":"admin","action":"login","status":"success","details":"Alex Morgan logged in as System Admin. Demo-only credentials were used.","ip":"127.0.0.1","createdAt":"2026-06-20T17:10:39.234Z","previousHash":"b72b1586baed2acff43b17c5e7a5795029f5f2014be732d0899aa546669c4200","eventHash":"337e46ed5dd27a17fa23ffd3033168b5c99089f6b99be2334c09af9dc132d984"},{"id":"aud_5881e0f581d0a3d7","documentId":null,"actorId":"usr_admin","actorRole":"admin","action":"login","status":"success","details":"Alex Morgan logged in as System Admin. Demo-only credentials were used.","ip":"127.0.0.1","createdAt":"2026-06-20T17:15:49.267Z","previousHash":"337e46ed5dd27a17fa23ffd3033168b5c99089f6b99be2334c09af9dc132d984","eventHash":"b76fc2bafbd1aaa9816cce4083cafe1d835aeff652951a1237b87b79226a6b22"},{"id":"aud_425ab71ab5d6c559","documentId":null,"actorId":"usr_reviewer","actorRole":"reviewer","action":"login","status":"success","details":"Maya Chen logged in as Reviewer / Manager. Demo-only credentials were used.","ip":"127.0.0.1","createdAt":"2026-06-20T17:19:33.574Z","previousHash":"b76fc2bafbd1aaa9816cce4083cafe1d835aeff652951a1237b87b79226a6b22","eventHash":"cd71423bd9a9e55fb273970d2b05544a32ae8885f0328926160d0e7929d93f83"},{"id":"aud_e7b9d45d53cc1f4b","documentId":null,"actorId":"usr_admin","actorRole":"admin","action":"login","status":"success","details":"Alex Morgan logged in as System Admin. Demo-only credentials were used.","ip":"127.0.0.1","createdAt":"2026-06-20T17:21:08.254Z","previousHash":"cd71423bd9a9e55fb273970d2b05544a32ae8885f0328926160d0e7929d93f83","eventHash":"0381bdb81578a719ca4fb13ac720fc67f5c1b562d884e55e7a62ccf9c4f1a3b2"}],"meta":{"createdAt":"2026-06-19T21:10:52.986Z","updatedAt":"2026-06-20T17:21:08.254Z","storage":"json-file","auditHashChained":true,"demoOnly":true}};
  const ROLE_NAMES = { submitter: 'Employee / Submitter', reviewer: 'Reviewer / Manager', admin: 'System Admin' };
  const STATUS_LABELS = { draft: 'Draft', pending: 'Pending Review', changes_requested: 'Changes Requested', approved: 'Approved', rejected: 'Rejected', archived: 'Archived' };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();
  const id = (prefix) => `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
  const publicUser = (user) => user ? { ...user, roleName: ROLE_NAMES[user.role] || user.role } : null;
  const loadDb = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || clone(SEED_DB); }
    catch (_) { return clone(SEED_DB); }
  };
  const saveDb = (db) => { db.meta = { ...(db.meta || {}), updatedAt: now() }; localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); };
  const jsonResponse = (payload, status = 200) => new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
  const errorResponse = (message, status = 400) => jsonResponse({ error: message }, status);
  const currentSession = (headers) => {
    const auth = headers.get('Authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!token) return null;
    try {
      const sessions = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
      const session = sessions[token];
      if (!session || Date.now() > session.expiresAt) return null;
      return { token, ...session };
    } catch (_) { return null; }
  };
  const persistSession = (token, session) => {
    let sessions = {};
    try { sessions = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}'); } catch (_) { sessions = {}; }
    sessions[token] = session;
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
  };
  const removeSession = (token) => {
    try { const sessions = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}'); delete sessions[token]; localStorage.setItem(SESSION_KEY, JSON.stringify(sessions)); } catch (_) {}
  };
  const canSeeDocument = (user, doc) => user.role === 'admin' || doc.ownerId === user.id || (doc.assignedTo === user.id && doc.status !== 'draft');
  const attachNames = (db, doc) => {
    const owner = db.users.find((u) => u.id === doc.ownerId);
    const reviewer = db.users.find((u) => u.id === doc.assignedTo);
    const receipt = doc.approvalReceipt ? { ...doc.approvalReceipt, approver: publicUser(db.users.find((u) => u.id === doc.approvalReceipt.approvedById)) } : null;
    return {
      ...doc,
      statusLabel: STATUS_LABELS[doc.status] || doc.status,
      owner: publicUser(owner),
      reviewer: publicUser(reviewer),
      approvalReceipt: receipt,
      integrity: {
        checkedAt: now(),
        available: false,
        verified: false,
        status: 'demo_record',
        expectedHash: doc.hash,
        currentHash: null,
        message: doc.storageName ? 'Static demo upload saved in this browser session. Backend byte verification is shown in the source version.' : 'Seeded portfolio demo record: fingerprint metadata is visible, but no backend file is attached in static mode.'
      },
      comments: (doc.comments || []).map((comment) => ({ ...comment, user: publicUser(db.users.find((u) => u.id === comment.userId)) }))
    };
  };
  const addAudit = (db, user, { documentId = null, action, details = '', status = 'success' }) => {
    const previousHash = db.audit?.at?.(-1)?.eventHash || 'GENESIS';
    const event = { id: id('aud'), documentId, actorId: user?.id || null, actorRole: user?.role || 'anonymous', action, status, details, ip: 'static-demo', createdAt: now(), previousHash };
    event.eventHash = `static-${Math.random().toString(16).slice(2)}`;
    db.audit = db.audit || [];
    db.audit.push(event);
    return event;
  };
  const readJson = async (init) => {
    if (!init.body) return {};
    if (typeof init.body === 'string') { try { return JSON.parse(init.body); } catch (_) { return {}; } }
    return {};
  };
  const hashFile = async (file) => {
    try {
      if (file?.arrayBuffer && crypto?.subtle) {
        const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
        return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (_) {}
    return `staticdemo${Math.random().toString(16).slice(2).padEnd(56, '0')}`.slice(0, 64);
  };
  const docStats = (docs, user) => {
    const byStatus = docs.reduce((acc, doc) => (acc[doc.status] = (acc[doc.status] || 0) + 1, acc), {});
    return {
      total: docs.length,
      pendingForMe: docs.filter((doc) => doc.status === 'pending' && (user.role === 'admin' || doc.assignedTo === user.id)).length,
      mySubmissions: docs.filter((doc) => doc.ownerId === user.id).length,
      approved: byStatus.approved || 0,
      changesRequested: byStatus.changes_requested || 0,
      verifiedFiles: 0,
      totalFileSize: docs.reduce((sum, doc) => sum + Number(doc.fileSize || 0), 0),
      byStatus
    };
  };

  async function handleApi(path, init, headers) {
    const method = (init.method || 'GET').toUpperCase();
    const db = loadDb();

    if (path === '/api/auth/login' && method === 'POST') {
      const body = await readJson(init);
      const email = String(body.email || '').trim().toLowerCase();
      const user = db.users.find((candidate) => candidate.email.toLowerCase() === email);
      if (!user || String(body.password || '') !== 'demo123') {
        addAudit(db, null, { action: 'failed_login', status: 'failed', details: `Failed static demo login for ${email || 'blank email'}.` });
        saveDb(db);
        return errorResponse('Invalid email or password. Demo accounts use demo123.', 401);
      }
      const token = id('static_token');
      const session = { userId: user.id, createdAt: Date.now(), lastSeenAt: Date.now(), expiresAt: Date.now() + 120 * 60 * 1000 };
      persistSession(token, session);
      addAudit(db, user, { action: 'login', details: `${user.name} logged in to the static portfolio demo as ${ROLE_NAMES[user.role]}.` });
      saveDb(db);
      return jsonResponse({ token, user: publicUser(user), session: { expiresAt: new Date(session.expiresAt).toISOString(), ttlMinutes: 120 }, demoOnly: true, staticDemo: true });
    }

    const session = currentSession(headers);
    if (!session) return errorResponse('Static demo session expired. Select a demo role again.', 401);
    const user = db.users.find((candidate) => candidate.id === session.userId);
    if (!user) return errorResponse('Demo user not found.', 401);

    if (path === '/api/auth/logout' && method === 'POST') { removeSession(session.token); addAudit(db, user, { action: 'logout', details: `${user.name} logged out of the static demo.` }); saveDb(db); return jsonResponse({ ok: true }); }
    if (path === '/api/auth/me' && method === 'GET') return jsonResponse({ user: publicUser(user), session: { expiresAt: new Date(session.expiresAt).toISOString(), ttlMinutes: Math.max(0, Math.round((session.expiresAt - Date.now()) / 60000)) }, demoOnly: true, staticDemo: true });
    if (path === '/api/users/reviewers' && method === 'GET') return jsonResponse({ reviewers: db.users.filter((u) => ['reviewer', 'admin'].includes(u.role)).map(publicUser) });

    const visibleDocs = db.documents.filter((doc) => canSeeDocument(user, doc));
    if (path === '/api/documents' && method === 'GET') return jsonResponse({ documents: visibleDocs.map((doc) => attachNames(db, doc)).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)) });
    if (path === '/api/stats' && method === 'GET') return jsonResponse(docStats(visibleDocs, user));
    if (path === '/api/audit' && method === 'GET') {
      const visibleIds = new Set(visibleDocs.map((doc) => doc.id));
      const events = (db.audit || []).filter((event) => event.documentId ? (user.role === 'admin' || visibleIds.has(event.documentId)) : (user.role === 'admin' || event.actorId === user.id)).map((event) => ({ ...event, actor: publicUser(db.users.find((u) => u.id === event.actorId)), document: db.documents.find((doc) => doc.id === event.documentId) || null })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return jsonResponse({ audit: events });
    }

    if (path === '/api/documents' && method === 'POST') {
      if (!['submitter', 'admin'].includes(user.role)) return errorResponse('Your role is not allowed to perform this action.', 403);
      const data = init.body instanceof FormData ? init.body : new FormData();
      const file = data.get('file');
      if (!file || !file.name) return errorResponse('Attach a document file first.', 400);
      const createdAt = now();
      const submitNow = data.get('submitNow') === 'true';
      const assignedTo = String(data.get('assignedTo') || db.users.find((u) => u.role === 'reviewer')?.id || 'usr_reviewer');
      const doc = {
        id: id('doc'), title: String(data.get('title') || file.name || 'Uploaded Document').trim().slice(0, 140), category: String(data.get('category') || 'General'), department: String(data.get('department') || user.department || 'General'), confidentiality: String(data.get('confidentiality') || 'Internal'), status: submitNow ? 'pending' : 'draft', ownerId: user.id, assignedTo, dueDate: String(data.get('dueDate') || ''), version: 1, versions: [], fileName: file.name || 'document', storageName: 'static-browser-demo', fileSize: file.size || 0, mimeType: file.type || 'application/octet-stream', fileKind: 'file', hash: await hashFile(file), submittedAt: submitNow ? createdAt : null, approvedAt: null, approvalReceipt: null, rejectionReason: '', notes: String(data.get('notes') || ''), comments: [], createdAt, updatedAt: createdAt
      };
      db.documents.unshift(doc);
      addAudit(db, user, { documentId: doc.id, action: submitNow ? 'uploaded_and_submitted' : 'upload', details: `${submitNow ? 'Uploaded and submitted' : 'Uploaded draft'} ${doc.title} in static demo.` });
      saveDb(db);
      return jsonResponse({ document: attachNames(db, doc) }, 201);
    }

    const docMatch = path.match(/^\/api\/documents\/([^/]+)(?:\/(submit|comment|decision|versions|download))?$/);
    if (docMatch) {
      const [, docId, action] = docMatch;
      const doc = db.documents.find((candidate) => candidate.id === docId);
      if (!doc || !canSeeDocument(user, doc)) return errorResponse('Document not found.', 404);
      if (action === 'download' && method === 'GET') {
        addAudit(db, user, { documentId: doc.id, action: 'download', details: `Downloaded static demo receipt for ${doc.title}.` }); saveDb(db);
        const body = `SecureDoc static demo download\nDocument: ${doc.title}\nSHA-256: ${doc.hash}\nThis portfolio demo does not store real uploaded files.`;
        return new Response(body, { status: 200, headers: { 'content-type': 'text/plain', 'content-disposition': `attachment; filename="${(doc.fileName || 'document').replace(/"/g, '')}.txt"` } });
      }
      if (action === 'submit' && method === 'PATCH') {
        if (doc.ownerId !== user.id && user.role !== 'admin') return errorResponse('Only the owner or admin can submit this document.', 403);
        doc.status = 'pending'; doc.submittedAt = now(); doc.rejectionReason = ''; doc.updatedAt = now();
        addAudit(db, user, { documentId: doc.id, action: 'submit', details: `Submitted ${doc.title} for review in static demo.` }); saveDb(db);
        return jsonResponse({ document: attachNames(db, doc) });
      }
      if (action === 'comment' && method === 'POST') {
        const body = await readJson(init); const text = String(body.body || '').trim();
        if (!text) return errorResponse('Comment cannot be empty.', 400);
        doc.comments = doc.comments || []; doc.comments.push({ id: id('cmt'), userId: user.id, body: text, createdAt: now() }); doc.updatedAt = now();
        addAudit(db, user, { documentId: doc.id, action: 'comment', details: `Added comment on ${doc.title}.` }); saveDb(db);
        return jsonResponse({ document: attachNames(db, doc) });
      }
      if (action === 'decision' && method === 'POST') {
        if (!(doc.status === 'pending' && (user.role === 'admin' || doc.assignedTo === user.id))) return errorResponse('This document is not available for your review.', 403);
        const body = await readJson(init); const decision = body.decision;
        if (decision === 'approve') { doc.status = 'approved'; doc.approvedAt = now(); doc.approvalReceipt = { id: id('rcpt'), hash: doc.hash, approvedAt: doc.approvedAt, approvedById: user.id, version: doc.version }; doc.rejectionReason = ''; }
        else if (decision === 'reject') { doc.status = 'rejected'; doc.rejectionReason = String(body.note || 'Rejected in static demo.'); }
        else { doc.status = 'changes_requested'; doc.rejectionReason = String(body.note || 'Changes requested in static demo.'); }
        if (body.note) { doc.comments = doc.comments || []; doc.comments.push({ id: id('cmt'), userId: user.id, body: String(body.note), createdAt: now() }); }
        doc.updatedAt = now();
        addAudit(db, user, { documentId: doc.id, action: decision === 'approve' ? 'approve' : decision === 'reject' ? 'reject' : 'request_changes', details: `Recorded ${decision} for ${doc.title} in static demo.` }); saveDb(db);
        return jsonResponse({ document: attachNames(db, doc) });
      }
      if (action === 'versions' && method === 'POST') {
        const data = init.body instanceof FormData ? init.body : new FormData(); const file = data.get('file');
        if (!file || !file.name) return errorResponse('Attach a revised document file first.', 400);
        doc.versions = doc.versions || []; doc.versions.push({ version: doc.version, fileName: doc.fileName, fileSize: doc.fileSize, mimeType: doc.mimeType, hash: doc.hash, status: doc.status, submittedAt: doc.submittedAt, approvedAt: doc.approvedAt, archivedAt: now() });
        doc.version = Number(doc.version || 1) + 1; doc.fileName = file.name; doc.fileSize = file.size || 0; doc.mimeType = file.type || 'application/octet-stream'; doc.hash = await hashFile(file); doc.status = data.get('submitNow') === 'true' ? 'pending' : 'draft'; doc.submittedAt = doc.status === 'pending' ? now() : null; doc.updatedAt = now(); doc.rejectionReason = ''; doc.approvalReceipt = null;
        addAudit(db, user, { documentId: doc.id, action: 'version_upload', details: `Uploaded v${doc.version} for ${doc.title} in static demo.` }); saveDb(db);
        return jsonResponse({ document: attachNames(db, doc) });
      }
    }

    return errorResponse('Static demo API route not found.', 404);
  }

  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, window.location.origin);
    if (url.origin === window.location.origin && url.pathname.startsWith('/api/')) {
      return handleApi(url.pathname, init, new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined)));
    }
    return ORIGINAL_FETCH(input, init);
  };
})();
