import AccountSettingsView from '@/components/account/view';
import SettingsLayout from '@/components/layouts/settings';

export default function AccountPage() {
  return (
    <SettingsLayout>
      <AccountSettingsView />
    </SettingsLayout>
  );
}
