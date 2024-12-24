import PlainLayout from '@/components/layouts/plain';
import { Metadata } from 'next';
import SpecifiedCommercialTransactions from '@/markdown/specified-commercial-transactions.mdx';

export const metadata: Metadata = {
  title: 'Specified Commercial Transactions | AppAgent',
};

export default function SpecifiedCommercialTransactionsPage() {
  return (
    <PlainLayout>
      <SpecifiedCommercialTransactions />
    </PlainLayout>
  );
}
