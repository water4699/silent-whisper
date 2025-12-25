import { SalaryCompareDemo } from "@/components/SalaryCompareDemo";

export default function Home() {
  return (
    <main className="">
      <div className="flex flex-col gap-8 items-center sm:items-start w-full">
        <SalaryCompareDemo />
      </div>
    </main>
  );
}
