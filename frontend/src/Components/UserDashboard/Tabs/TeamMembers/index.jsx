import { useState } from 'react';

import CreateTeamMemberForm from './CreateTeamMemberForm';
import DataTable from './TeamMembersDatatable';

export default function TeamMembers({ token }) {
    const [showModal, setShowModal] = useState(false);

    return (
        <div>
            <div className="clearfix mb-3">
                <button className="btn btn-success float-end" onClick={() => setShowModal(true)}>
                    Add Member
                </button>
                <h3 className="mb-0">Team Members</h3>
            </div>

            <CreateTeamMemberForm token={token} showModal={showModal} setShowModal={setShowModal} />

            <div className="">
                <DataTable token={token} />
            </div>
        </div>
    );
}
