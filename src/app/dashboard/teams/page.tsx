import SettingsLayout from '@/components/layouts/settings';
import { ManageTeams } from '@/components/teams/manage-teams';

export const metadata = {
  title: 'Teams',
  description: 'Manage your teams',
};

export default function TeamsPage() {
  return (
    <SettingsLayout>
      <ManageTeams />
    </SettingsLayout>
  );
}
