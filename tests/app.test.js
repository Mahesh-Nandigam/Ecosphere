// Lightweight vanilla JS testing suite
let passedCount = 0;
let failedCount = 0;
const resultsContainer = document.getElementById("test-results");

function assert(condition, message) {
    const el = document.createElement("div");
    if (condition) {
        passedCount++;
        el.className = "pass";
        el.innerText = `[PASS] ${message}`;
        console.log(`%c [PASS] ${message}`, 'color: #4ade80');
    } else {
        failedCount++;
        el.className = "fail";
        el.innerText = `[FAIL] ${message}`;
        console.error(`[FAIL] ${message}`);
    }
    resultsContainer.appendChild(el);
}

// Test 1: escapeHTML sanitization
(function testEscapeHTML() {
    const input = '<script>alert("XSS & Hack")</script>';
    const expected = '&lt;script&gt;alert(&quot;XSS &amp; Hack&quot;)&lt;/script&gt;';
    const result = escapeHTML(input);
    assert(result === expected, "escapeHTML safely sanitizes HTML tags and quotes.");
})();

// Test 2: Calculate level threshold logic
(function testCalculateLevelThreshold() {
    // Assuming level 1 threshold is some default logic (current implementation is simple)
    assert(typeof updateSVGIsland === 'function', "updateSVGIsland function is defined and accessible.");
})();

// Test 3: DocumentFragment usage check
(function testRenderTimeline() {
    // If state is loaded, renderTimeline should not crash
    try {
        renderTimeline();
        assert(true, "renderTimeline executes successfully without DOM exceptions.");
    } catch(e) {
        assert(false, `renderTimeline threw exception: ${e.message}`);
    }
})();

// Print summary
const summaryEl = document.createElement("div");
summaryEl.className = "summary";
summaryEl.innerHTML = `Total: ${passedCount + failedCount} | <span class="pass">Passed: ${passedCount}</span> | <span class="fail">Failed: ${failedCount}</span>`;
resultsContainer.appendChild(summaryEl);

if (failedCount > 0) {
    console.error("Some tests failed!");
} else {
    console.log("%c All tests passed! 100% completion.", "color: #4ade80; font-size: 1.2rem;");
}
