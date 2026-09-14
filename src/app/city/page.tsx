import CityDigitalTwin from '@/components/city/CityDigitalTwin';

export const metadata = {
  title: 'Nova City Digital Twin',
  description: 'Smart City simulation powered by Bitmap Algebra',
};

export default function CityPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 overflow-hidden">
      <CityDigitalTwin />
    </div>
  );
}
