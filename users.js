document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const roleFilter = document.getElementById('role-filter');
    const tableBody = document.getElementById('users-tbody');
    const emptyState = document.getElementById('empty-state');
    const usersTable = document.getElementById('users-table');
    
    const modal = document.getElementById('add-user-modal');
    const btnInvite = document.getElementById('btn-invite');
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel-modal');
    const form = document.getElementById('add-user-form');
    const modalTitle = document.getElementById('modal-title');

    const rowTemplate = tableBody.rows[0].cloneNode(true);
    let isEditing = false;
    let editingRow = null;

    // 2. Search & Filter
    function filterTable() {
        const searchTerm = searchInput.value.toLowerCase();
        const roleTerm = roleFilter.value;
        const rows = tableBody.querySelectorAll('tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const name = row.querySelector('.member-name').textContent.toLowerCase();
            const email = row.querySelector('.user-email').textContent.toLowerCase();
            const username = row.cells[1].textContent.toLowerCase();
            const role = row.querySelector('.member-role').textContent;

            const matchesSearch = name.includes(searchTerm) || email.includes(searchTerm) || username.includes(searchTerm);
            const matchesRole = roleTerm === 'All' || role === roleTerm;

            if (matchesSearch && matchesRole) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        document.getElementById('total-count').textContent = rows.length;
        document.getElementById('active-count').textContent = tableBody.querySelectorAll('.status.active').length;
        document.getElementById('invited-count').textContent = tableBody.querySelectorAll('.status.invited').length;

        if (visibleCount === 0) {
            usersTable.style.display = 'none';
            emptyState.classList.remove('hidden');
        } else {
            usersTable.style.display = 'table';
            emptyState.classList.add('hidden');
        }
    }

    filterTable();
    searchInput.addEventListener('input', filterTable);
    roleFilter.addEventListener('change', filterTable);

    // 3. Modal Functions
    const openModal = (mode = 'add', row = null) => {
        isEditing = mode === 'edit';
        editingRow = row;
        modalTitle.textContent = isEditing ? 'Edit user' : 'Invite user';
        
        form.reset();
        if (isEditing && row) {
            document.getElementById('input-name').value = row.querySelector('.member-name').textContent;
            document.getElementById('input-username').value = row.cells[1].textContent;
            document.getElementById('input-role').value = row.querySelector('.member-role').textContent;
            document.getElementById('check-web').checked = !!row.querySelector('.tag.web');
            document.getElementById('check-mobile').checked = !!row.querySelector('.tag.mobile');
        }
        modal.showModal();
        document.getElementById('input-name').focus();
    };

    const closeModal = () => {
        modal.close();
    };

    btnInvite.addEventListener('click', () => openModal('add'));
    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // 4. Edit/Delete Actions
    tableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-icon.edit');
        const deleteBtn = e.target.closest('.btn-icon.delete');
        const row = e.target.closest('tr');

        if (editBtn) openModal('edit', row);

        if (deleteBtn) {
            const name = row.querySelector('.member-name').textContent;
            if(confirm(`Are you sure you want to remove ${name}?`)) {
                row.remove();
                filterTable();
            }
        }
    });

    // 5. Form Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('input-name').value;
        const username = document.getElementById('input-username').value;
        const role = document.getElementById('input-role').value;
        const hasWeb = document.getElementById('check-web').checked;
        const hasMobile = document.getElementById('check-mobile').checked;

        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        let platformsHtml = '';
        if (hasWeb) platformsHtml += `<span class="tag web">Web</span>\n`;
        if (hasMobile) platformsHtml += `<span class="tag mobile">Mobile</span>`;
        if (!hasWeb && !hasMobile) platformsHtml += `<span class="tag none">None</span>`;

        const row = editingRow || rowTemplate.cloneNode(true);
        row.querySelector('.member-name').textContent = name;
        row.querySelector('.avatar').textContent = initials;
        if (!editingRow || row.cells[1].textContent !== username) {
            row.querySelector('.user-email').textContent = `${username}@example.com`;
        }
        row.cells[1].textContent = username;
        row.querySelector('.member-role').textContent = role;
        row.querySelector('.platform-tags').innerHTML = platformsHtml;

        if (!editingRow) {
            const status = row.querySelector('.status');
            status.textContent = 'Invited';
            status.className = 'status invited';
            row.cells[5].textContent = 'Pending';
            tableBody.appendChild(row);
        }

        filterTable();
        closeModal();
    });
});