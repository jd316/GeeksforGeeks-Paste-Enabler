(function() {
    console.log("GeeksforGeeks Paste Enabler activated");
    
    // Detect if we're on a contest page - Enhanced detection
    const isContestPage = window.location.href.includes('/contest/') || 
                         window.location.href.includes('job-a-thon') ||
                         window.location.href.includes('jobathon') ||
                         window.location.href.includes('/events/') ||
                         window.location.href.includes('/contest/job-a-thon') ||
                         document.title.toLowerCase().includes('contest') ||
                         document.title.toLowerCase().includes('job-a-thon') ||
                         document.title.toLowerCase().includes('jobathon') ||
                         document.title.toLowerCase().includes('hiring challenge');
                         
    console.log("Contest page detected:", isContestPage);
    
    // Define a variable to track if we've successfully enabled paste
    let pasteEnabled = false;
    
    // Use more aggressive techniques for contest pages
    if (isContestPage) {
        console.log("Using contest-specific paste enablement");
    }
    
    // MOST IMPORTANT: Direct clipboard manipulation
    function enableDirectClipboardAccess() {
        // Create a hidden textarea to facilitate pasting
        const hiddenTextarea = document.createElement('textarea');
        hiddenTextarea.style.position = 'absolute';
        hiddenTextarea.style.left = '-9999px';
        hiddenTextarea.style.top = '-9999px';
        document.body.appendChild(hiddenTextarea);
        
        // Listen for Ctrl+V globally
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.keyCode === 86) { // 86 is V
                console.log("Ctrl+V detected, intercepting for direct paste");
                
                // Get the active element (where cursor is)
                const activeElement = document.activeElement;
                
                // Focus the hidden textarea
                hiddenTextarea.focus();
                hiddenTextarea.value = '';
                
                // Execute paste into hidden area
                setTimeout(function() {
                    // Get pasted content
                    const pastedText = hiddenTextarea.value;
                    console.log("Pasted content:", pastedText);
                    
                    if (pastedText && activeElement) {
                        // Return focus to original element
                        activeElement.focus();
                        
                        // Insert the text at cursor position
                        if (activeElement.isContentEditable) {
                            // For contentEditable elements
                            document.execCommand('insertText', false, pastedText);
                        } else if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
                            // For input/textarea elements
                            const start = activeElement.selectionStart;
                            const end = activeElement.selectionEnd;
                            const value = activeElement.value;
                            
                            activeElement.value = value.substring(0, start) + pastedText + value.substring(end);
                            activeElement.selectionStart = activeElement.selectionEnd = start + pastedText.length;
                            
                            // Trigger input event
                            const event = new Event('input', { bubbles: true });
                            activeElement.dispatchEvent(event);
                        } else {
                            // For contest problem editor (ACE editor)
                            // Try to insert using ACE editor API if available
                            tryInsertTextToAceEditor(activeElement, pastedText);
                        }
                    }
                }, 10);
                
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
        }, true);
        
        console.log("Direct clipboard access enabled");
    }
    
    // Try to insert text directly into ACE editor
    function tryInsertTextToAceEditor(element, text) {
        try {
            // Look for the ACE editor instance
            let aceEditorElement = element;
            
            // If the element itself is not the editor, try to find it
            if (!element.classList.contains('ace_editor')) {
                aceEditorElement = document.querySelector('.ace_editor');
            }
            
            if (aceEditorElement && window.ace) {
                // Get the editor instance
                const editor = window.ace.edit(aceEditorElement);
                if (editor) {
                    editor.session.insert(editor.getCursorPosition(), text);
                    console.log("Text inserted into ACE editor");
                    return true;
                }
            }
            
            // If specific GeeksforGeeks editor exists
            if (window.editor) {
                window.editor.insert(text);
                console.log("Text inserted via global editor object");
                return true;
            }
            
            return false;
        } catch (err) {
            console.error("Failed to insert into ACE editor:", err);
            return false;
        }
    }
    
    // Main function to enable pasting
    function enablePaste() {
        // Try multiple selectors to find the code editor
        const editorSelectors = [
            'textarea',
            '[contenteditable="true"]',
            '.ace_editor',
            '.editor-area',
            '.CodeMirror',
            '.code-editor',
            '#editor',
            '[data-cy="editor"]',
            '.monaco-editor',
            // Add more specific GeeksforGeeks selectors
            '#txtInput1',
            '#txtInput2',
            '.problem-input',
            '.custom-input-container textarea',
            'div[role="textbox"]',
            '.inputArea',
            '.ace_editor textarea',
            '.ace_text-input',
            '#editorContentArea',
            // Contest-specific selectors
            '.ace_text-layer',
            '.ace-tm',
            '.ace_content',
            '.custominput',
            '.ace_scroller',
            '.inputarea'
        ];
        
        // Find all potential editors
        editorSelectors.forEach(selector => {
            const editors = document.querySelectorAll(selector);
            
            editors.forEach(editor => {
                // Special handling for ACE editor
                if (editor.classList.contains('ace_editor') && window.ace) {
                    try {
                        const aceEditor = window.ace.edit(editor);
                        // Override paste in ACE editor
                        aceEditor.commands.addCommand({
                            name: 'paste',
                            bindKey: {win: 'Ctrl-V', mac: 'Command-V'},
                            exec: function(editor) {
                                navigator.clipboard.readText().then(text => {
                                    aceEditor.session.insert(aceEditor.getCursorPosition(), text);
                                }).catch(err => {
                                    console.error("Failed to read clipboard:", err);
                                });
                                return true;
                            }
                        });
                        console.log("ACE editor paste command overridden");
                    } catch (err) {
                        console.error("Failed to override ACE editor:", err);
                    }
                } else {
                    // For non-ACE editors, use the brute force approach
                    try {
                        // Remove all event listeners (brute force approach)
                        const newEditor = editor.cloneNode(true);
                        if (editor.parentNode) {
                            editor.parentNode.replaceChild(newEditor, editor);
                            console.log("Replaced editor to remove all event listeners");
                            
                            // Add our custom paste handler with capture phase
                            newEditor.addEventListener('paste', function(e) {
                                console.log("Paste event allowed in editor");
                                e.stopImmediatePropagation();
                            }, true);
                            
                            // Also handle keyboard shortcuts
                            newEditor.addEventListener('keydown', function(e) {
                                if ((e.ctrlKey || e.metaKey) && e.keyCode === 86) {
                                    console.log("Ctrl+V allowed in editor");
                                    // Let the event proceed naturally
                                }
                            }, true);
                            
                            console.log("Paste enabled for editor:", newEditor);
                        }
                    } catch (err) {
                        console.error("Failed to replace editor:", err);
                        // Fallback: just remove onpaste handler
                        if (editor.onpaste) {
                            editor.onpaste = null;
                            console.log("Removed onpaste handler");
                        }
                    }
                }
            });
        });
        
        // Override core clipboard handlers
        overrideCoreClipboardFunctions();
        
        // Bypass jQuery paste prevention
        if (window.jQuery) {
            // Save original jQuery event binding
            const originalJQueryOn = window.jQuery.fn.on;
            
            // Override jQuery's on method to prevent paste blocking
            window.jQuery.fn.on = function() {
                if (arguments.length > 0 && 
                    (arguments[0] === 'paste' || 
                     (typeof arguments[0] === 'string' && 
                      (arguments[0].includes('paste') || arguments[0].includes('keydown'))))) {
                    console.log("Blocked jQuery paste/keydown prevention");
                    return this; // Return without binding
                }
                return originalJQueryOn.apply(this, arguments);
            };
            
            // Also override the bind method
            const originalJQueryBind = window.jQuery.fn.bind;
            window.jQuery.fn.bind = function() {
                if (arguments.length > 0 && 
                    (arguments[0] === 'paste' || 
                     (typeof arguments[0] === 'string' && 
                      (arguments[0].includes('paste') || arguments[0].includes('keydown'))))) {
                    console.log("Blocked jQuery bind paste/keydown prevention");
                    return this;
                }
                return originalJQueryBind.apply(this, arguments);
            };
            
            console.log("jQuery paste prevention bypassed");
        }

        // For contest pages, try to specifically find and handle the code editor
        if (isContestPage) {
            handleContestPageEditor();
        }
    }
    
    // Special handling for GeeksforGeeks contest pages
    function handleContestPageEditor() {
        // Check if there's a global editor object (common in contest pages)
        if (window.editor) {
            console.log("Found global editor object, overriding paste functionality");
            
            // For ACE editor specifically
            try {
                window.editor.commands.addCommand({
                    name: 'paste',
                    bindKey: {win: 'Ctrl-V', mac: 'Command-V'},
                    exec: function(editor) {
                        navigator.clipboard.readText().then(text => {
                            editor.session.insert(editor.getCursorPosition(), text);
                        }).catch(err => {
                            console.error("Failed to read clipboard:", err);
                        });
                        return true;
                    }
                });
            } catch (err) {
                console.error("Failed to override global editor:", err);
            }
        }
        
        // Try to find all ACE editor instances recursively
        findAndOverrideAllAceEditors();
    }
    
    // Find and override all ACE editor instances
    function findAndOverrideAllAceEditors() {
        // Look for all potential ACE editor containers
        const potentialEditors = document.querySelectorAll('.ace_editor, [id*="editor"], [class*="editor"], .ace_text-layer, .ace_content, .ace_scroller, [data-cy="editor"], [data-id="editor"], .monaco-editor, .editor-container');
        
        console.log("Found " + potentialEditors.length + " potential editor containers");
        
        potentialEditors.forEach(container => {
            try {
                // Check if this element has ACE editor
                if (container.env && container.env.editor) {
                    // Direct access to editor instance
                    const editor = container.env.editor;
                    overrideAceEditor(editor);
                    pasteEnabled = true;
                } else if (window.ace && window.ace.edit) {
                    // Try to get editor using ace.edit
                    try {
                        const editor = window.ace.edit(container);
                        overrideAceEditor(editor);
                        pasteEnabled = true;
                    } catch (e) {
                        // Not an ACE editor, ignore
                    }
                }
            } catch (err) {
                // Not an ACE editor or can't override
            }
        });
        
        // Additional attempt for JobAthon specific editor - look for any global editor instance
        if (typeof window.editor !== 'undefined' && window.editor) {
            try {
                overrideAceEditor(window.editor);
                pasteEnabled = true;
                console.log("Found and overridden global editor instance");
            } catch (err) {
                console.error("Failed to override global editor:", err);
            }
        }
        
        // Try to find any __ace variable in the global scope
        for (let key in window) {
            if (key.includes('ace') || key.includes('editor')) {
                try {
                    let obj = window[key];
                    if (obj && typeof obj === 'object' && obj.session && obj.commands) {
                        overrideAceEditor(obj);
                        pasteEnabled = true;
                        console.log("Found and overridden editor via global variable:", key);
                    }
                } catch (err) {
                    // Ignore errors
                }
            }
        }
    }
    
    // Override paste in a specific ACE editor instance
    function overrideAceEditor(editor) {
        if (!editor || !editor.commands) return;
        
        try {
            editor.commands.addCommand({
                name: 'paste',
                bindKey: {win: 'Ctrl-V', mac: 'Command-V'},
                exec: function(editor) {
                    navigator.clipboard.readText().then(text => {
                        editor.session.insert(editor.getCursorPosition(), text);
                    }).catch(err => {
                        console.error("Failed to read clipboard:", err);
                    });
                    return true;
                }
            });
            console.log("ACE editor paste command overridden");
        } catch (err) {
            console.error("Failed to override ACE editor command:", err);
        }
    }
    
    // Override core clipboard functions
    function overrideCoreClipboardFunctions() {
        // Override document.execCommand to ensure cut/copy/paste can't be disabled
        const originalExecCommand = document.execCommand;
        document.execCommand = function(command) {
            if (command === 'paste') {
                console.log("Paste execCommand intercepted and allowed");
                return true; // Pretend it succeeded
            }
            return originalExecCommand.apply(this, arguments);
        };
        
        // Override clipboardData methods
        if (window.clipboardData) {
            const originalGetData = window.clipboardData.getData;
            window.clipboardData.getData = function() {
                console.log("clipboardData.getData intercepted");
                return originalGetData.apply(this, arguments);
            };
        }
        
        // Override preventDefault for clipboard events
        const originalPreventDefault = Event.prototype.preventDefault;
        Event.prototype.preventDefault = function() {
            if (this.type === 'paste' || 
                this.type === 'copy' || 
                this.type === 'cut' || 
                (this.type === 'keydown' && this.ctrlKey && this.keyCode === 86)) {
                console.log("Prevented blocking clipboard event:", this.type);
                return false;
            }
            return originalPreventDefault.call(this);
        };
        
        // Override stopPropagation for clipboard events
        const originalStopPropagation = Event.prototype.stopPropagation;
        Event.prototype.stopPropagation = function() {
            if (this.type === 'paste' || 
                this.type === 'copy' || 
                this.type === 'cut' ||
                (this.type === 'keydown' && this.ctrlKey && this.keyCode === 86)) {
                console.log("Prevented stopPropagation for clipboard event:", this.type);
                return false;
            }
            return originalStopPropagation.call(this);
        };
    }
    
    // Inject a style to remove any paste-blocking overlays
    function injectCss() {
        const style = document.createElement('style');
        style.textContent = `
            .no-paste, .paste-blocker, [class*="nopaste"], .paste-disabled, .no-copy-paste,
            [class*="prevent-paste"], [class*="no-paste"], [id*="paste-blocker"], [class*="overlay"],
            .preventCopy, .preventPaste, .blockSelection, .lockContent, .code-protection { 
                display: none !important; 
                pointer-events: none !important;
            }
            /* Ensure editors are clickable */
            textarea, [contenteditable="true"], .ace_editor, .editor-area, .CodeMirror, .code-editor, #editor,
            .problem-input, .custom-input-container textarea, div[role="textbox"], .inputArea, .ace_text-input,
            .ace_text-layer, .custominput, .ace_content, .ace_scroller, [class*="ace_"],
            [class*="editor"], [id*="editor"], pre[class*="language-"], pre[class*="code-"] {
                pointer-events: auto !important;
                user-select: text !important;
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                z-index: 1000 !important;
            }
            /* Make sure no overlay prevents interaction */
            body::before, body::after, .page-wrapper::before, .page-wrapper::after,
            main::before, main::after, div::before, div::after, [class*="blocker"], 
            [class*="overlay"], [class*="prevent"], [id*="overlay"], [id*="blocker"],
            [class*="prevent"]::before, [class*="prevent"]::after,
            [class*="protection"], [id*="protection"] {
                pointer-events: none !important;
                display: none !important;
            }
            /* JobAthon specific styles */
            ${isContestPage ? `
                .ace_editor, .ace_layer, .ace_content, .ace_scroller, .ace_text-layer, .ace_line {
                    pointer-events: auto !important;
                    -webkit-user-select: auto !important;
                    -moz-user-select: auto !important;
                    user-select: auto !important;
                    z-index: 1000 !important;
                }
                /* Extra rules for JobAthon */
                [class*="job-a-thon"] [class*="editor"], 
                [class*="jobathon"] [class*="editor"],
                [class*="contest"] [class*="editor"],
                .ace_text-input, .ace_focus {
                    pointer-events: auto !important;
                    user-select: text !important;
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                }
                /* Disable all paste prevention scripts */
                [onpaste], [oncut], [oncopy], [onkeydown] {
                    onpaste: null !important;
                    oncut: null !important;
                    oncopy: null !important;
                    onkeydown: null !important;
                }
                /* Make editor visible and accessible */
                .ace_editor, .ace_content {
                    opacity: 1 !important;
                    visibility: visible !important;
                }
            ` : ''}
        `;
        document.head.appendChild(style);
        
        // Also force remove any script-added inline styles
        if (isContestPage) {
            setTimeout(function() {
                const allEditorElements = document.querySelectorAll('.ace_editor, [class*="editor"], [id*="editor"], .ace_text-layer, .ace_content, .ace_text-input');
                allEditorElements.forEach(el => {
                    // Remove any inline style that might prevent interaction
                    if (el.style) {
                        if (el.style.userSelect === 'none') el.style.userSelect = 'text';
                        if (el.style.pointerEvents === 'none') el.style.pointerEvents = 'auto';
                        if (el.style.opacity === '0') el.style.opacity = '1';
                        if (el.style.visibility === 'hidden') el.style.visibility = 'visible';
                    }
                    
                    // Remove event listeners by cloning
                    try {
                        const clone = el.cloneNode(true);
                        if (el.parentNode) {
                            el.parentNode.replaceChild(clone, el);
                        }
                    } catch (e) {
                        // Ignore errors during cloning
                    }
                });
            }, 1000);
        }
    }
    
    // Create a custom paste button
    function createPasteButton() {
        const button = document.createElement('button');
        button.textContent = "Paste";
        button.style.cssText = 'position:fixed;top:70px;right:20px;background:#4CAF50;color:white;padding:10px;border:none;border-radius:5px;z-index:9999;cursor:pointer;';
        
        button.addEventListener('click', async function() {
            try {
                // Get clipboard text
                const text = await navigator.clipboard.readText();
                
                // Get the active element
                const activeElement = document.activeElement;
                if (activeElement) {
                    if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
                        const start = activeElement.selectionStart;
                        const end = activeElement.selectionEnd;
                        activeElement.value = activeElement.value.substring(0, start) + text + activeElement.value.substring(end);
                        activeElement.selectionStart = activeElement.selectionEnd = start + text.length;
                        
                        // Trigger input event
                        const event = new Event('input', { bubbles: true });
                        activeElement.dispatchEvent(event);
                    } else if (activeElement.isContentEditable) {
                        document.execCommand('insertText', false, text);
                    } else {
                        // Try to use ACE editor if available
                        const success = tryInsertTextToAceEditor(activeElement, text);
                        
                        // If ACE editor not available, try to find the editor
                        if (!success) {
                            // Look for editors
                            const editors = document.querySelectorAll('.ace_editor, [id*="editor"], [class*="editor"]');
                            let inserted = false;
                            
                            // Try each editor
                            for (let i = 0; i < editors.length; i++) {
                                if (tryInsertTextToAceEditor(editors[i], text)) {
                                    inserted = true;
                                    break;
                                }
                            }
                            
                            // If still not successful, show text to copy manually
                            if (!inserted && isContestPage) {
                                alert("Couldn't access editor directly. Here's your text to manually paste: " + text);
                            }
                        }
                    }
                } else {
                    // No active element, find first editor
                    const editors = document.querySelectorAll('.ace_editor, [id*="editor"], [class*="editor"]');
                    let inserted = false;
                    
                    // Try each editor
                    for (let i = 0; i < editors.length; i++) {
                        if (tryInsertTextToAceEditor(editors[i], text)) {
                            inserted = true;
                            break;
                        }
                    }
                    
                    if (!inserted) {
                        alert("Please click in the editor first before pasting.");
                    }
                }
            } catch (err) {
                console.error("Couldn't access clipboard:", err);
                alert("Please copy text first, then click this button to paste");
            }
        });
        
        document.body.appendChild(button);
        
        // On contest pages, add a second button for direct code paste
        if (isContestPage) {
            const codeButton = document.createElement('button');
            codeButton.textContent = "Paste Code";
            codeButton.style.cssText = 'position:fixed;top:110px;right:20px;background:#3F51B5;color:white;padding:10px 15px;border:none;border-radius:5px;z-index:9999;cursor:pointer;font-weight:bold;font-size:14px;box-shadow:0 2px 5px rgba(0,0,0,0.3);';
            
            codeButton.addEventListener('click', async function() {
                try {
                    const text = await navigator.clipboard.readText();
                    let pasted = false;
                    
                    // Try all ways to paste into code editor specifically
                    // 1. Global editor
                    if (window.editor && window.editor.session) {
                        try {
                            window.editor.session.insert(window.editor.getCursorPosition(), text);
                            alert("Code pasted successfully!");
                            pasted = true;
                        } catch (e) {
                            console.error("Failed to paste using global editor:", e);
                        }
                    }
                    
                    // 2. Find ACE editors
                    if (!pasted) {
                        const aceEditors = document.querySelectorAll('.ace_editor, .ace_text-layer, .ace_content, .ace_scroller');
                        for (let i = 0; i < aceEditors.length; i++) {
                            if (tryInsertTextToAceEditor(aceEditors[i], text)) {
                                alert("Code pasted successfully!");
                                pasted = true;
                                break;
                            }
                        }
                    }
                    
                    // 3. Try the direct DOM insertion method for ACE
                    if (!pasted) {
                        // Get all potential editor textareas
                        const editorTextareas = document.querySelectorAll('.ace_text-input');
                        if (editorTextareas.length > 0) {
                            // Focus and paste
                            editorTextareas[0].focus();
                            document.execCommand('insertText', false, text);
                            alert("Attempted direct paste. Please check if code was inserted.");
                            pasted = true;
                        }
                    }
                    
                    // 4. Last resort - show text
                    if (!pasted) {
                        // Create a temporary textarea with the code
                        const tempArea = document.createElement('textarea');
                        tempArea.value = text;
                        tempArea.style.cssText = 'position:fixed;top:150px;right:20px;width:300px;height:200px;z-index:10000;';
                        document.body.appendChild(tempArea);
                        tempArea.select();
                        
                        alert("Couldn't find code editor. A temporary box with your code has been created. Press Ctrl+A to select all, then Ctrl+C to copy again, and try pasting manually.");
                        
                        // Remove after 30 seconds
                        setTimeout(() => tempArea.remove(), 30000);
                    }
                } catch (err) {
                    console.error("Couldn't access clipboard:", err);
                    alert("Please copy code first, then try again");
                }
            });
            
            document.body.appendChild(codeButton);
            
            // Create additional helper text
            const helperText = document.createElement('div');
            helperText.textContent = "For JobAthon: Click blue button after copying code";
            helperText.style.cssText = 'position:fixed;top:155px;right:20px;background:rgba(0,0,0,0.7);color:white;padding:5px 10px;border-radius:3px;z-index:9999;font-size:12px;';
            document.body.appendChild(helperText);
            
            // Auto-hide helper after 20 seconds
            setTimeout(() => {
                helperText.style.opacity = '0';
                helperText.style.transition = 'opacity 1s';
                setTimeout(() => helperText.remove(), 1000);
            }, 20000);
        }
    }
    
    // Try additional direct insertion method - last resort
    function tryDirectDomInsertion() {
        console.log("Attempting direct DOM insertion as last resort");
        
        // Look for all editable elements
        const editableElements = [
            ...document.querySelectorAll('textarea'),
            ...document.querySelectorAll('[contenteditable="true"]'),
            ...document.querySelectorAll('.ace_text-input'),
            ...document.querySelectorAll('input[type="text"]')
        ];
        
        editableElements.forEach(el => {
            // Remove all event listeners
            const clone = el.cloneNode(true);
            if (el.parentNode) {
                el.parentNode.replaceChild(clone, el);
                console.log("Replaced potentially blocked element:", el);
            }
            
            // Try to focus and paste
            setTimeout(() => {
                try {
                    clone.focus();
                    clone.select();
                    document.execCommand('paste');
                } catch (e) {
                    // Ignore errors
                }
            }, 100);
        });
        
        // Look for ACE editor specific elements
        const aceEditorElements = document.querySelectorAll('.ace_editor, .ace_content, .ace_text-layer');
        if (aceEditorElements.length > 0) {
            // Create our own input and focus it
            const directInput = document.createElement('textarea');
            directInput.style.cssText = 'position:absolute;left:50%;top:50%;width:300px;height:200px;transform:translate(-50%,-50%);z-index:10000;background:white;color:black;';
            directInput.placeholder = 'Click here and paste your code, then click "Apply Code" button';
            document.body.appendChild(directInput);
            
            // Create apply button
            const applyButton = document.createElement('button');
            applyButton.textContent = 'Apply Code';
            applyButton.style.cssText = 'position:absolute;left:50%;top:calc(50% + 110px);transform:translateX(-50%);z-index:10001;background:#f44336;color:white;padding:8px 16px;border:none;border-radius:4px;';
            
            applyButton.addEventListener('click', function() {
                const code = directInput.value;
                if (code) {
                    // Try to inject the code into all potential editor elements
                    aceEditorElements.forEach(el => {
                        tryInsertTextToAceEditor(el, code);
                    });
                    
                    // Also try global editor
                    if (window.editor && window.editor.session) {
                        try {
                            window.editor.session.insert(window.editor.getCursorPosition(), code);
                        } catch (e) {
                            // Ignore errors
                        }
                    }
                    
                    // Remove our elements
                    directInput.remove();
                    applyButton.remove();
                    
                    alert("Code applied! If you don't see your code in the editor, please try again or try clicking directly in the editor first.");
                }
            });
            
            document.body.appendChild(applyButton);
            
            // Auto-focus
            setTimeout(() => directInput.focus(), 200);
        }
    }
    
    // Create a status indicator to show if extension is working
    function createStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'gfg-paste-enabler-status';
        indicator.style.cssText = 'position:fixed;bottom:10px;left:10px;width:12px;height:12px;border-radius:50%;background:#FF5722;z-index:10000;opacity:0.7;';
        indicator.title = 'GeeksforGeeks Paste Enabler - Initializing...';
        document.body.appendChild(indicator);
        
        // Check if we've successfully found and modified the editor
        setTimeout(function() {
            if (pasteEnabled) {
                indicator.style.background = '#4CAF50'; // Green
                indicator.title = 'GeeksforGeeks Paste Enabler - Active (Editor detected)';
            } else if (isContestPage) {
                indicator.style.background = '#FFC107'; // Yellow-orange
                indicator.title = 'GeeksforGeeks Paste Enabler - Working but editor not detected yet. Try clicking in the editor.';
                
                // One last attempt to find the editor
                setTimeout(function() {
                    findAndOverrideAllAceEditors();
                    if (pasteEnabled) {
                        indicator.style.background = '#4CAF50';
                        indicator.title = 'GeeksforGeeks Paste Enabler - Active (Editor detected)';
                    }
                }, 2000);
            } else {
                indicator.style.background = '#2196F3'; // Blue
                indicator.title = 'GeeksforGeeks Paste Enabler - Active but not on a contest page';
            }
        }, 2500);
        
        // Add click handler to show help
        indicator.addEventListener('click', function() {
            alert('GeeksforGeeks Paste Enabler status:\n\n' + 
                  '• Green: Working with editor detected\n' +
                  '• Orange: Working but editor not detected\n' +
                  '• Blue: Active but not on a contest page\n\n' +
                  'Use keyboard shortcuts:\n' +
                  '• Alt+V: Alternative paste method\n' +
                  '• Alt+D: Emergency paste dialog');
        });
    }
    
    // Special handling for JobAthon hiring challenges
    function handleJobathonHiringPage() {
        console.log("JobAthon hiring challenge page detected, applying specific fixes");
        
        // Look for the ACE editor with more specific selectors
        const jobathonEditorSelectors = [
            '#ace-editor',
            '#editor-container',
            '.ace_editor',
            '[class*="editor"]', 
            '[id*="editor"]',
            '.editor-container',
            '.ace_content',
            '.problemEditor',
            '.codingProblemEditor',
            '#problemTab .ace_editor',
            '.ace_text-layer'
        ];
        
        // Wait a bit longer for the editor to initialize
        setTimeout(() => {
            // Try each selector
            for (const selector of jobathonEditorSelectors) {
                const elements = document.querySelectorAll(selector);
                console.log(`Found ${elements.length} elements for selector ${selector}`);
                
                elements.forEach(el => {
                    try {
                        // First, try to enable selection and paste
                        el.style.userSelect = 'text';
                        el.style.webkitUserSelect = 'text';
                        el.style.pointerEvents = 'auto';
                        
                        // Try to find ACE editor
                        if (window.ace && window.ace.edit) {
                            try {
                                const editor = window.ace.edit(el);
                                overrideAceEditor(editor);
                                pasteEnabled = true;
                                console.log("Successfully overridden editor for selector", selector);
                            } catch (err) {
                                // Not an ACE editor or can't get instance
                            }
                        }
                    } catch (err) {
                        console.error("Error handling editor element:", err);
                    }
                });
            }
            
            // Special case for the hiring challenge: force enable all textareas
            const textareas = document.querySelectorAll('textarea, .ace_text-input, [contenteditable="true"]');
            textareas.forEach(textarea => {
                // Clone to remove event listeners
                const clone = textarea.cloneNode(true);
                if (textarea.parentNode) {
                    textarea.parentNode.replaceChild(clone, textarea);
                }
                
                // Make sure it's editable
                clone.readOnly = false;
                clone.addEventListener('paste', e => {
                    e.stopPropagation();
                }, true);
            });
            
            // Look for editor container by structure - JobAthon specific
            const problemTabs = document.querySelectorAll('#problemTab, .problemTab, [class*="problemTab"]');
            problemTabs.forEach(tab => {
                console.log("Found problem tab, looking for editor inside");
                // Inspect children recursively for editor
                const findEditor = (element) => {
                    if (!element) return;
                    
                    // Check if this element is an editor
                    if (element.className && (
                        element.className.includes('ace_editor') ||
                        element.className.includes('editor')
                    )) {
                        console.log("Found editor inside problem tab:", element);
                        tryInsertTextToAceEditor(element, "// Test paste");
                        return;
                    }
                    
                    // Check children
                    const children = element.children;
                    if (children && children.length) {
                        for (let i = 0; i < children.length; i++) {
                            findEditor(children[i]);
                        }
                    }
                };
                
                findEditor(tab);
            });
        }, 2000);
    }
    
    // Create a more aggressive paste button for JobAthon hiring challenges
    function createJobathonPasteButton() {
        const button = document.createElement('button');
        button.textContent = "💼 JobAthon Paste";
        button.style.cssText = 'position:fixed;top:150px;right:20px;background:#7E57C2;color:white;padding:8px 12px;border:none;border-radius:4px;z-index:10000;font-weight:bold;box-shadow:0 2px 5px rgba(0,0,0,0.3);';
        
        button.addEventListener('click', async function() {
            try {
                const text = await navigator.clipboard.readText();
                
                // First, try the normal methods
                let pasted = false;
                
                // 1. First try global editor
                if (window.editor && window.editor.session) {
                    try {
                        window.editor.session.insert(window.editor.getCursorPosition(), text);
                        alert("Code pasted successfully!");
                        pasted = true;
                    } catch (e) {
                        console.error("Failed to paste using global editor:", e);
                    }
                }
                
                // 2. Try all ACE editors
                if (!pasted) {
                    const editorElements = document.querySelectorAll('.ace_editor, .ace_text-layer, .ace_content, .ace_scroller, [class*="editor"], [id*="editor"]');
                    for (const el of editorElements) {
                        if (tryInsertTextToAceEditor(el, text)) {
                            alert("Code pasted successfully!");
                            pasted = true;
                            break;
                        }
                    }
                }
                
                // 3. Try to find and use iframes containing editors
                if (!pasted) {
                    const iframes = document.querySelectorAll('iframe');
                    for (const iframe of iframes) {
                        try {
                            // Try to access iframe content
                            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                            
                            // Find editors inside the iframe
                            const iframeEditors = iframeDoc.querySelectorAll('.ace_editor, .ace_content, [class*="editor"]');
                            for (const editor of iframeEditors) {
                                try {
                                    // Try ACE editor API
                                    if (iframe.contentWindow.ace && iframe.contentWindow.ace.edit) {
                                        const aceEditor = iframe.contentWindow.ace.edit(editor);
                                        aceEditor.session.insert(aceEditor.getCursorPosition(), text);
                                        alert("Code pasted into iframe editor!");
                                        pasted = true;
                                        break;
                                    }
                                } catch (e) {
                                    // Try direct approach
                                    const textareas = editor.querySelectorAll('textarea, .ace_text-input');
                                    if (textareas.length > 0) {
                                        textareas[0].focus();
                                        iframeDoc.execCommand('insertText', false, text);
                                        alert("Attempted direct paste into iframe editor.");
                                        pasted = true;
                                        break;
                                    }
                                }
                            }
                            
                            if (pasted) break;
                        } catch (e) {
                            // Security restrictions might prevent accessing iframe
                            console.error("Couldn't access iframe:", e);
                        }
                    }
                }
                
                // 4. If all else fails, try the emergency approach
                if (!pasted) {
                    tryDirectDomInsertion();
                }
            } catch (err) {
                console.error("Clipboard access error:", err);
                alert("Please copy code first, then try again.");
            }
        });
        
        document.body.appendChild(button);
        
        // Add a tooltip
        const tooltip = document.createElement('div');
        tooltip.textContent = "Special paste button for JobAthon hiring challenges";
        tooltip.style.cssText = 'position:fixed;top:190px;right:20px;background:rgba(0,0,0,0.8);color:white;padding:5px 8px;border-radius:3px;z-index:9999;font-size:12px;max-width:180px;';
        document.body.appendChild(tooltip);
        
        // Hide tooltip after 15 seconds
        setTimeout(() => {
            tooltip.style.opacity = '0';
            tooltip.style.transition = 'opacity 1s';
            setTimeout(() => tooltip.remove(), 1000);
        }, 15000);
    }
    
    // Run all our functions
    enableDirectClipboardAccess();
    enablePaste();
    overrideCoreClipboardFunctions();
    injectCss();
    createPasteButton();
    createStatusIndicator();
    
    // Also set an interval to handle dynamically loaded editors and continuously defeat paste blockers
    setInterval(enablePaste, 800);
    
    // Handle contest pages specifically
    if (isContestPage) {
        // Run more frequently on contest pages
        setInterval(handleContestPageEditor, 500);
        
        // Special handling for JobAthon hiring challenges
        if (window.location.href.includes('/contest/job-a-thon') || 
            window.location.href.includes('hiring-challenge') ||
            document.title.toLowerCase().includes('hiring challenge')) {
            handleJobathonHiringPage();
            // Run it again after a delay to catch late-loading editors
            setTimeout(handleJobathonHiringPage, 3000);
        }
        
        // Wait for ACE editor to initialize
        setTimeout(function() {
            findAndOverrideAllAceEditors();
        }, 1500);
        
        // Additional delays to catch late-loading editors
        setTimeout(function() {
            findAndOverrideAllAceEditors();
            // Check if we've successfully enabled paste
            if (!pasteEnabled) {
                console.log("Still having trouble finding the editor. Trying again with deeper DOM search.");
                // Try more aggressive techniques
                const allElements = document.querySelectorAll('*');
                for (let i = 0; i < allElements.length; i++) {
                    const el = allElements[i];
                    const tagName = el.tagName.toLowerCase();
                    if (tagName === 'textarea' || tagName === 'div' || tagName === 'pre') {
                        if (el.className && (
                            el.className.includes('editor') || 
                            el.className.includes('ace') || 
                            el.className.includes('code') || 
                            el.className.includes('monaco'))) {
                            console.log("Found potential editor via deep search:", el);
                            tryInsertTextToAceEditor(el, "// Paste test");
                        }
                    }
                }
            }
        }, 3000);
        
        // Set up mutation observer to detect dynamically added editors
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    // Check if any added nodes might be editors
                    for (let i = 0; i < mutation.addedNodes.length; i++) {
                        const node = mutation.addedNodes[i];
                        if (node.nodeType === 1) { // ELEMENT_NODE
                            if (node.className && (
                                node.className.includes('editor') || 
                                node.className.includes('ace') || 
                                node.className.includes('code'))) {
                                console.log("Dynamic editor detected:", node);
                                findAndOverrideAllAceEditors();
                                break;
                            }
                        }
                    }
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // Alert user that extension is active
    const notification = document.createElement('div');
    notification.style.cssText = 'position:fixed;bottom:10px;right:10px;background:#4CAF50;color:white;padding:10px;border-radius:5px;z-index:9999;opacity:0.9;';
    notification.textContent = 'Paste Enabler active! Use the green "Paste" button if Ctrl+V does not work.';
    
    if (isContestPage) {
        notification.textContent += ' For code editor use the blue "Paste Code" button.';
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 10 seconds on contest pages, 5 seconds elsewhere
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 1s';
        setTimeout(() => notification.remove(), 1000);
    }, isContestPage ? 10000 : 5000);
    
    // Add keyboard shortcut specifically for JobAthon pages
    if (isContestPage) {
        document.addEventListener('keydown', function(e) {
            // Alt+V - special paste shortcut for JobAthon
            if (e.altKey && e.key === 'v') {
                e.preventDefault();
                console.log("Alt+V detected - special paste for JobAthon");
                
                // Try to get clipboard content
                navigator.clipboard.readText().then(text => {
                    // Try all known methods to paste
                    let pasted = false;
                    
                    // Try global editor
                    if (window.editor && window.editor.session) {
                        try {
                            window.editor.session.insert(window.editor.getCursorPosition(), text);
                            pasted = true;
                            console.log("Pasted via global editor");
                        } catch (err) {}
                    }
                    
                    // Try ACE editors
                    if (!pasted) {
                        const aceEditors = document.querySelectorAll('.ace_editor, .ace_text-layer, .ace_content');
                        for (let i = 0; i < aceEditors.length && !pasted; i++) {
                            if (tryInsertTextToAceEditor(aceEditors[i], text)) {
                                pasted = true;
                                console.log("Pasted via ACE editor");
                            }
                        }
                    }
                    
                    // Direct DOM method
                    if (!pasted) {
                        // Get active element or ACE text input
                        const activeEl = document.activeElement;
                        if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
                            document.execCommand('insertText', false, text);
                            pasted = true;
                            console.log("Pasted via execCommand");
                        }
                    }
                    
                    if (!pasted) {
                        console.log("Alt+V paste failed, show alert");
                        alert("Alt+V paste failed. Try clicking the blue 'Paste Code' button instead.");
                    }
                }).catch(err => {
                    console.error("Failed to read clipboard for Alt+V:", err);
                });
            }
        });
    }
    
    // Add keyboard shortcut for direct DOM insertion (Alt+D)
    if (isContestPage) {
        document.addEventListener('keydown', function(e) {
            if (e.altKey && e.key === 'd') {
                e.preventDefault();
                tryDirectDomInsertion();
            }
        });
        
        // Create a last resort button
        const lastResortButton = document.createElement('button');
        lastResortButton.textContent = "🚨 Emergency Paste";
        lastResortButton.style.cssText = 'position:fixed;bottom:10px;right:20px;background:#f44336;color:white;padding:8px;border:none;border-radius:5px;z-index:10000;cursor:pointer;font-weight:bold;';
        
        lastResortButton.addEventListener('click', function() {
            tryDirectDomInsertion();
        });
        
        document.body.appendChild(lastResortButton);
    }
    
    // Add special JobAthon button for hiring challenge pages
    if (window.location.href.includes('/contest/job-a-thon') || 
        window.location.href.includes('hiring-challenge') ||
        document.title.toLowerCase().includes('hiring challenge')) {
        createJobathonPasteButton();
    }
    
    // Add URL change detection for single-page application navigation
    function monitorUrlChanges() {
        // Store initial URL
        let lastUrl = window.location.href;
        
        // Check for URL changes periodically
        const urlCheckInterval = setInterval(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                console.log("URL changed from", lastUrl, "to", currentUrl);
                lastUrl = currentUrl;
                
                // Check if we're still on a contest page
                if (currentUrl.includes('/contest/') || 
                    currentUrl.includes('job-a-thon') || 
                    currentUrl.includes('jobathon')) {
                    
                    console.log("Still on a contest page, reapplying editor detection");
                    
                    // Run main functions again
                    findAndOverrideAllAceEditors();
                    handleContestPageEditor();
                    
                    // For job-a-thon, run specialized functions
                    if (currentUrl.includes('/contest/job-a-thon') || 
                        currentUrl.includes('hiring-challenge') ||
                        document.title.toLowerCase().includes('hiring challenge')) {
                        
                        console.log("JobAthon page navigation detected, reapplying specialization");
                        setTimeout(handleJobathonHiringPage, 500);
                        
                        // Notify user
                        const notif = document.createElement('div');
                        notif.textContent = 'Page changed - paste functionality reinitialized';
                        notif.style.cssText = 'position:fixed;bottom:10px;left:50%;transform:translateX(-50%);background:#673AB7;color:white;padding:8px 12px;border-radius:4px;z-index:9999;opacity:0.9;';
                        document.body.appendChild(notif);
                        
                        // Auto-hide notification
                        setTimeout(() => {
                            notif.style.opacity = '0';
                            notif.style.transition = 'opacity 0.5s';
                            setTimeout(() => notif.remove(), 500);
                        }, 3000);
                    }
                }
            }
        }, 1000);
    }
    
    // Add URL change monitoring for single-page applications (like JobAthon challenges)
    monitorUrlChanges();
})(); 