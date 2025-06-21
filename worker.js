export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Redirect from old domains to new domain (preserving hash)
    if (url.hostname === 'page-to-markdown.action-api.workers.dev' || 
        (url.hostname === 'tools.paste.im' && url.pathname === '/page-to-markdown')) {
      return new Response(`<!DOCTYPE html><script>location.href='https://page-to-markdown.paste.im/'+location.hash</script>`, {
        headers: { 'Content-Type': 'text/html' },
      });
    }
    
    if (request.method === 'GET') {
      // Serve the HTML form
      return new Response(getHTML(url.searchParams), {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    
    if (request.method === 'POST') {
      try {
        const formData = await request.formData();
        const accountId = formData.get('accountId');
        const apiKey = formData.get('apiKey');
        const targetUrl = formData.get('url');
        
        if (!accountId || !apiKey || !targetUrl) {
          return new Response(getHTML(url.searchParams, 'Error: All fields are required'), {
            headers: { 'Content-Type': 'text/html' },
            status: 400,
          });
        }
        
        // Make API call to Cloudflare Browser Rendering
        const apiResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/markdown`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              url: targetUrl,
            }),
          }
        );
        
        if (!apiResponse.ok) {
          return new Response(getHTML(url.searchParams, `HTTP Error: ${apiResponse.status} ${apiResponse.statusText}`), {
            headers: { 'Content-Type': 'text/html' },
            status: 400,
          });
        }
        
        const result = await apiResponse.json();
        
        if (!result.success) {
          const errorMsg = result.errors && result.errors.length > 0 
            ? result.errors.map(e => e.message || e.code || 'Unknown error').join(', ')
            : result.error || 'Unknown API error';
          return new Response(getHTML(url.searchParams, `API Error: ${errorMsg}`), {
            headers: { 'Content-Type': 'text/html' },
            status: 400,
          });
        }
        
        // Check if the result is empty or just whitespace
        if (!result.result || result.result.trim() === '') {
          return new Response(getHTML(url.searchParams, `No content extracted: The webpage at "${targetUrl}" returned empty markdown. This could be due to anti-bot protection, JavaScript-only content, or the page blocking automated access.`), {
            headers: { 'Content-Type': 'text/html' },
            status: 400,
          });
        }
        
        // Return the markdown result
        return new Response(getHTML(url.searchParams, null, result.result), {
          headers: { 'Content-Type': 'text/html' },
        });
        
      } catch (error) {
        console.error('Processing error:', error);
        return new Response(getHTML(url.searchParams, `Error: ${error.message || 'Unknown error occurred'}`), {
          headers: { 'Content-Type': 'text/html' },
          status: 500,
        });
      }
    }
    
    return new Response('Method not allowed', { status: 405 });
  },
};

function getHTML(searchParams, errorMessage = null, markdownResult = null) {
  // Note: Hash values will be parsed on the client side via JavaScript
  const accountId = '';
  const apiKey = '';
  const url = '';
  
  // Simple HTML escape function
  const escapeHtml = (text) => {
    if (!text) return '';
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#39;');
  };
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>&#x1F4C4;</text></svg>">
<meta name="robots" content="noindex, nofollow, noimageindex, nocache, noarchive, nosnippet">
<meta http-equiv="cache-control" content="no-cache" />
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Web Page to Markdown</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css" />
<style>
:root {
    --bs-body-bg: #f5f1e8
}
.form-control:focus {
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
.btn-primary {
    background-color: #0d6efd;
    border-color: #0d6efd;
}
.btn-primary:hover {
    background-color: #0b5ed7;
    border-color: #0a58ca;
}
.alert-danger {
    background-color: #f8d7da;
    border-color: #f5c2c7;
    color: #842029;
    padding: 1rem;
    margin-bottom: 1rem;
    border: 1px solid;
    border-radius: 0.375rem;
}
.markdown-result {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    padding: 1rem;
    font-family: 'Courier New', monospace;
    white-space: pre-wrap;
    max-height: 400px;
    overflow-y: auto;
}
.label-with-icon {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.label-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}
.btn-primary {
    width: auto;
}
@media (prefers-color-scheme:dark) {
    :root {
        --bs-secondary: #cdcdcd;
        --bs-body-color: #fff;
        --bs-body-bg: #1b1b1b
    }
    a {
        color: #2196f3
    }
    hr {
        color: #fff;
        opacity: .75
    }
    .form-control {
        background-color: #2b2b2b;
        border-color: #495057;
        color: #fff;
    }
    .form-control:focus {
        background-color: #2b2b2b;
        border-color: #86b7fe;
        color: #fff;
    }
    .btn-primary {
        background-color: #0d6efd;
        border-color: #0d6efd;
    }
    .alert-danger {
        background-color: #2c0b0e;
        border-color: #842029;
        color: #ea868f;
        padding: 1rem;
        margin-bottom: 1rem;
        border: 1px solid;
        border-radius: 0.375rem;
    }
    .markdown-result {
        background-color: #2b2b2b;
        border-color: #495057;
        color: #fff;
    }
}
</style>
</head>
<body>
<div class="container pt-5">
<h1 class="display-6">
    <svg id="headerLogo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 208 128" style="width: 38px; height: 24px; margin-right: 12px; vertical-align: middle;">
        <rect width="198" height="118" x="5" y="5" fill="none" stroke="#000" stroke-width="10" ry="10"/>
        <path d="M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0-30-33h20V30h20v35h20z" fill="#000"/>
    </svg>
    Web Page to Markdown
</h1>
<hr>
<p class="lead">Convert any webpage to Markdown format using Cloudflare's Browser Rendering API.</p>

${errorMessage ? `<div class="alert alert-danger" role="alert"><strong>Error:</strong> ${escapeHtml(errorMessage)}</div>` : ''}

<form method="POST" class="mb-4" id="converterForm">
    <div class="mt-4">
        <label for="accountId" class="form-label label-with-icon">
            <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" viewBox="0 -70 256 256" class="label-icon">
                <path fill="#FFF" d="m202 49-5-2C172 103 73 69 67 86c-1 11 54 2 94 4 12 1 18 10 12 25h11c11-37 48-18 50-30-3-8-43 0-32-36Z"/>
                <path fill="#F4811F" d="M176 108c2-5 1-10-1-13-3-4-7-6-11-6l-93-1-1-1v-1c0-2 1-2 2-2l93-1c11-1 22-10 27-20l5-14v-2a60 60 0 0 0-116-6 28 28 0 0 0-43 29 39 39 0 0 0-37 44l1 2h171l2-2 1-6Z"/>
                <path fill="#FAAD3F" d="M206 49h-3l-2 1-3 13c-2 5-1 10 1 13 3 4 7 6 11 6l20 1 2 1v2l-3 1-20 1c-11 1-23 10-27 20l-1 5 1 2h70l2-2 2-14c0-27-23-50-50-50"/>
            </svg>
            Account ID
        </label>
        <input type="text" class="form-control" id="accountId" name="accountId" value="${accountId}" autocomplete="username" required>
        <div class="form-text">Your <a href="https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/" target="_blank">Cloudflare Account ID</a> (not Zone ID)</div>
    </div>
    
    <div class="mt-4">
        <label for="apiKey" class="form-label label-with-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" class="label-icon">
                <path fill="#e5b71e" d="M32.614 3.414C28.31-.89 21.332-.89 17.027 3.414c-3.391 3.392-4.098 8.439-2.144 12.535l-3.916 3.915c-.64.641-.841 1.543-.625 2.359l-1.973 1.972c-.479-.48-1.252-.48-1.731 0l-1.731 1.732c-.479.479-.479 1.253 0 1.732l-.867.864c-.479-.478-1.253-.478-1.731 0l-.866.867c-.479.479-.479 1.253 0 1.732.015.016.036.02.051.033-.794 1.189-.668 2.812.382 3.863 1.195 1.195 3.134 1.195 4.329 0L20.08 21.144c4.097 1.955 9.144 1.247 12.535-2.146 4.302-4.302 4.302-11.28-.001-15.584zm-1.731 5.195c-.957.956-2.509.956-3.464 0-.956-.956-.956-2.507 0-3.464.955-.956 2.507-.956 3.464 0 .956.957.956 2.508 0 3.464z"/>
            </svg>
            Cloudflare API Token
        </label>
        <input type="password" class="form-control" id="apiKey" name="apiKey" value="${apiKey}" autocomplete="current-password" required>
        <div class="form-text">Your <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank">Cloudflare API token</a> with Browser Rendering permissions</div>
    </div>
    
    <div class="mt-4">
        <label for="url" class="form-label label-with-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" class="label-icon">
                <path fill="#3B88C3" d="M18 0C8.059 0 0 8.059 0 18s8.059 18 18 18 18-8.059 18-18S27.941 0 18 0zM2.05 19h3.983c.092 2.506.522 4.871 1.229 7H4.158a15.885 15.885 0 0 1-2.108-7zM19 8V2.081c2.747.436 5.162 2.655 6.799 5.919H19zm7.651 2c.754 2.083 1.219 4.46 1.317 7H19v-7h7.651zM17 2.081V8h-6.799C11.837 4.736 14.253 2.517 17 2.081zM17 10v7H8.032c.098-2.54.563-4.917 1.317-7H17zM6.034 17H2.05a15.9 15.9 0 0 1 2.107-7h3.104c-.705 2.129-1.135 4.495-1.227 7zm1.998 2H17v7H9.349c-.754-2.083-1.219-4.459-1.317-7zM17 28v5.919c-2.747-.437-5.163-2.655-6.799-5.919H17zm2 5.919V28h6.8c-1.637 3.264-4.053 5.482-6.8 5.919zM19 26v-7h8.969c-.099 2.541-.563 4.917-1.317 7H19zm10.967-7h3.982a15.87 15.87 0 0 1-2.107 7h-3.104c.706-2.129 1.136-4.494 1.229-7zm0-2c-.093-2.505-.523-4.871-1.229-7h3.104a15.875 15.875 0 0 1 2.107 7h-3.982zm.512-9h-2.503c-.717-1.604-1.606-3.015-2.619-4.199A16.034 16.034 0 0 1 30.479 8zM10.643 3.801C9.629 4.985 8.74 6.396 8.023 8H5.521a16.047 16.047 0 0 1 5.122-4.199zM5.521 28h2.503c.716 1.604 1.605 3.015 2.619 4.198A16.031 16.031 0 0 1 5.521 28zm19.836 4.198c1.014-1.184 1.902-2.594 2.619-4.198h2.503a16.031 16.031 0 0 1-5.122 4.198z"/>
            </svg>
            URL
        </label>
        <input type="url" class="form-control" id="url" name="url" value="${url}" autocomplete="url" required>
        <div class="form-text">The webpage URL to convert to Markdown</div>
    </div>
    
    <div class="mt-4">
        <button type="submit" class="btn btn-primary me-3">Convert to Markdown</button>
        <button type="button" class="btn btn-secondary" onclick="showCurlCommand()">Run Locally (curl)</button>
    </div>
</form>

<div id="curlSection" class="mt-4" style="display: none;">
    <h3>Run Locally with curl</h3>
    <p>Copy and run this command in your terminal to convert the webpage locally:</p>
    <div class="mb-2">
        <button class="btn btn-sm btn-secondary" onclick="copyCurlCommand()">Copy Command</button>
    </div>
    <div class="markdown-result mt-3 mb-4" id="curlCommand">    </div>
</div>

<script>
function copyToClipboard() {
    const text = document.getElementById('markdownResult').textContent;
    navigator.clipboard.writeText(text).then(function() {
        const btn = document.querySelector('button[onclick="copyToClipboard()"]');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-success');
        setTimeout(function() {
            btn.textContent = originalText;
            btn.classList.remove('btn-success');
            btn.classList.add('btn-secondary');
        }, 2000);
    });
}

function showCurlCommand() {
    const form = document.getElementById('converterForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const accountId = document.getElementById('accountId').value;
    const apiKey = document.getElementById('apiKey').value;
    const url = document.getElementById('url').value;
    
    const curlCommand = \`curl -sSX POST "https://api.cloudflare.com/client/v4/accounts/\${accountId}/browser-rendering/markdown" \\\\
  -H "Content-Type: application/json" \\\\
  -H "Authorization: Bearer \${apiKey}" \\\\
  -d '{"url": "\${url}"}' | jq -r .result\`;
    
    document.getElementById('curlCommand').textContent = curlCommand;
    document.getElementById('curlSection').style.display = 'block';
    document.getElementById('curlSection').scrollIntoView({ behavior: 'smooth' });
}

function copyCurlCommand() {
    const text = document.getElementById('curlCommand').textContent;
    navigator.clipboard.writeText(text).then(function() {
        const btn = document.querySelector('button[onclick="copyCurlCommand()"]');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-success');
        setTimeout(function() {
            btn.textContent = originalText;
            btn.classList.remove('btn-success');
            btn.classList.add('btn-secondary');
        }, 2000);
    });
}
</script>

${markdownResult ? `
<div class="mt-4">
    <h3>Markdown Result</h3>
    <div class="mb-2">
        <button class="btn btn-sm btn-secondary" onclick="copyToClipboard()">Copy to Clipboard</button>
    </div>
    <div class="markdown-result mt-3 mb-4" contenteditable="true" id="markdownResult">${escapeHtml(markdownResult)}</div>
</div>
` : ''}

<script>
// Parse hash parameters and pre-fill form
function parseHashParams() {
    const hash = window.location.hash.substring(1);
    const accountIdField = document.getElementById('accountId');
    const apiKeyField = document.getElementById('apiKey');
    const urlField = document.getElementById('url');
    
    // First try hash parameters
    if (hash) {
        const params = new URLSearchParams(hash);
        
        if (params.get('accountId')) {
            accountIdField.value = params.get('accountId');
        }
        if (params.get('apiKey')) {
            apiKeyField.value = params.get('apiKey');
        }
        if (params.get('url')) {
            urlField.value = params.get('url');
        }
    }
    
    // Then check sessionStorage for values (in case of error recovery)
    if (!accountIdField.value && sessionStorage.getItem('temp_accountId')) {
        accountIdField.value = sessionStorage.getItem('temp_accountId');
        sessionStorage.removeItem('temp_accountId');
    }
    if (!apiKeyField.value && sessionStorage.getItem('temp_apiKey')) {
        apiKeyField.value = sessionStorage.getItem('temp_apiKey');
        sessionStorage.removeItem('temp_apiKey');
    }
    if (!urlField.value && sessionStorage.getItem('temp_url')) {
        urlField.value = sessionStorage.getItem('temp_url');
        sessionStorage.removeItem('temp_url');
    }
    
    // Update hash after restoring values
    updateHash();
}

// Update hash based on current form values (excluding URL field)
function updateHash() {
    const accountId = document.getElementById('accountId').value;
    const apiKey = document.getElementById('apiKey').value;
    // Don't include URL in hash - it changes frequently and shouldn't be bookmarked
    
    const params = new URLSearchParams();
    
    if (accountId) params.set('accountId', accountId);
    if (apiKey) params.set('apiKey', apiKey);
    
    const hashString = params.toString();
    if (hashString) {
        window.history.replaceState(null, null, '#' + hashString);
    } else {
        window.history.replaceState(null, null, window.location.pathname);
    }
}

// Setup event listeners for real-time hash updates (only for credentials)
function setupFormListeners() {
    const accountIdField = document.getElementById('accountId');
    const apiKeyField = document.getElementById('apiKey');
    // Don't add listener to URL field - we don't want it in bookmarks
    
    accountIdField.addEventListener('input', updateHash);
    apiKeyField.addEventListener('input', updateHash);
    
    // Add form submit handler to disable button during processing
    const form = document.querySelector('form');
    const submitButton = form.querySelector('button[type="submit"]');
    
    form.addEventListener('submit', function() {
        submitButton.disabled = true;
        
        // Store original button content
        const originalContent = submitButton.innerHTML;
        
        // Replace with loading spinner
        submitButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="#fff" viewBox="0 0 24 24" style="width: 20px; height: 20px; display: block; margin: 0 auto;"><style>@keyframes spinner_MGfb{93.75%,to{opacity:.2}}.spinner_S1WN{animation:spinner_MGfb .8s linear infinite;animation-delay:-.8s}</style><circle cx="4" cy="12" r="3" class="spinner_S1WN"/><circle cx="12" cy="12" r="3" class="spinner_S1WN" style="animation-delay:-.65s"/><circle cx="20" cy="12" r="3" class="spinner_S1WN" style="animation-delay:-.5s"/></svg>';
        
        // Store form values in case we need to restore them after an error
        const accountId = document.getElementById('accountId').value;
        const apiKey = document.getElementById('apiKey').value;
        const url = document.getElementById('url').value;
        
        // Store in sessionStorage temporarily for error recovery
        if (accountId) sessionStorage.setItem('temp_accountId', accountId);
        if (apiKey) sessionStorage.setItem('temp_apiKey', apiKey);
        if (url) sessionStorage.setItem('temp_url', url);
    });
}

// Run on page load
document.addEventListener('DOMContentLoaded', function() {
    parseHashParams();
    setupFormListeners();
    updateFaviconForTheme();
});

// Run when hash changes (for navigation)
window.addEventListener('hashchange', parseHashParams);

// Update favicon and header logo based on color scheme
function updateFaviconForTheme() {
    const favicon = document.querySelector('link[rel="icon"]');
    const headerLogo = document.getElementById('headerLogo');
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const lightFavicon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 208 128'%3E%3Crect width='198' height='118' x='5' y='5' fill='none' stroke='%23000' stroke-width='10' ry='10'/%3E%3Cpath d='M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0-30-33h20V30h20v35h20z' fill='%23000'/%3E%3C/svg%3E";
    const darkFavicon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 208 128'%3E%3Crect width='198' height='118' x='5' y='5' fill='%23fff' stroke='%23000' stroke-width='10' ry='10'/%3E%3Cpath d='M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0-30-33h20V30h20v35h20z' fill='%23000'/%3E%3C/svg%3E";
    
    favicon.href = isDarkMode ? darkFavicon : lightFavicon;
    
    // Update header logo
    if (headerLogo) {
        const rect = headerLogo.querySelector('rect');
        const path = headerLogo.querySelector('path');
        
        rect.setAttribute('stroke', '#000');
        rect.setAttribute('fill', isDarkMode ? '#fff' : 'none');
        path.setAttribute('fill', '#000');
    }
}

// Listen for theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateFaviconForTheme);
</script>

</div>
</body>
</html>`;
}
