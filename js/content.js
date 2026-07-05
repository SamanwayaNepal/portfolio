/* Samanwaya Nepal — content store.
   Default content lives here; admins can override any of it from admin.html.
   Overrides are saved in this browser's localStorage (GitHub Pages is a static
   host, so there is no server database). Admins can export/import a JSON
   backup to move content between browsers or commit it to the repository. */
(function () {
  'use strict';

  var DEFAULTS = {
    heroTitle: "Young people, building the democracy they'll inherit.",
    heroText: "Samanwaya Nepal is a youth-centered institution where young citizens — across every geography, ethnicity, gender, and background — converge to lead the civic systems that shape their lives.",
    meaningQuote: "“Samanwaya” means coordination, systemic harmony, and cross-sectoral collaboration — the deliberate art of unifying diverse forces toward a shared, constructive purpose.",
    founderQuote: "Nepal's democratic future depends on the active leadership of its young people — not as beneficiaries, but as co-designers of the systems they inherit.",
    founderIntro: "A youth expert, policy advocate, and drafting member of Nepal's National Youth Policy 2025. He has reached thousands of young people through leadership and civic-participation programs across Nepal and beyond.",
    visionText: "An inclusive, accountable, and resilient democratic society where all young people — irrespective of gender, ethnicity, geography, or background — have the agency, platform, and equity to shape the decisions that govern their lives.",
    missionText: "To fortify youth participation across democratic governance and safeguard social inclusion — through leadership incubation, civic literacy, grassroots organizing, and evidence-based cross-sectoral collaboration.",
    email: "info@samanwaya.org.np",
    phone: "",
    address: "Kathmandu, Nepal",
    stat1n: "8", stat1l: "Program pillars",
    stat2n: "4", stat2l: "Tiers: local to global",
    stat3n: "5", stat3l: "UN SDGs targeted",
    stat4n: "1000+", stat4l: "Youth reached",
    events: [],
    notices: []
  };

  var KEY = 'sn_content_v1';

  function readOverrides() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }

  window.SN = {
    DEFAULTS: DEFAULTS,
    KEY: KEY,
    get: function () {
      var o = readOverrides(), out = {}, k;
      for (k in DEFAULTS) out[k] = (o[k] !== undefined && o[k] !== null && o[k] !== '') ? o[k] : DEFAULTS[k];
      return out;
    },
    overrides: readOverrides,
    save: function (patch) {
      var o = readOverrides(), k;
      for (k in patch) o[k] = patch[k];
      try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
      return o;
    },
    reset: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
    }
  };
})();
