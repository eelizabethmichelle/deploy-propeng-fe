import { Button } from "@/components/ui/button"

export default function SidebarTrue() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-xl font-bold">Contoh Button Variants</h1>
      
      <div className="flex gap-2">
        <Button>Default</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>

      <h2 className="mt-4 text-lg font-semibold">Button Sizes</h2>
      <div className="flex gap-2">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">🔍</Button>
      </div>
    </div>
  )
}
