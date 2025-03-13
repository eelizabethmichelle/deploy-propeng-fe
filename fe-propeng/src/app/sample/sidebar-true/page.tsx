"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { Calendar } from "@/components/ui/calendar"
import { buttonVariants } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import React from "react"
import { cn } from "@/lib/utils"
import { CalendarIcon, Check, CheckCircle, Copy, Lock, LockIcon } from "lucide-react"
import { format } from "date-fns"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { SelectPills } from "@/components/ui/multiple-select"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"


/* Sidebar */
export default function SidebarTrue() {

/* Router */
const router = useRouter();

/* Form */
const form = useForm({
  defaultValues: {
    username: "",
    email: "",
    role: "", // Menyimpan pilihan "Siswa" atau "Guru"
    angkatan: "", // Akan muncul jika memilih "Siswa"

  },
})

const role = form.watch("role") // Untuk mengamati perubahan role

const onSubmit = (data: any) => {
  console.log("Form Data:", data)
}

/* Password */
const [currentPassword, setCurrentPassword] = useState("")
const [password, setPassword] = useState("")
const [passwordConfirmation, setPasswordConfirmation] = useState("")

/* Multi Select Pills */
const data = [
  { id: "1", name: "Mickey" },
  { id: "2", name: "Arshad" },
  { id: "3", name: "Dien" },
  { id: "4", name: "Abil" },
  { id: "5", name: "Ica" },
];
const [selectedValues, setSelectedValues] = useState<string[]>([]);

const handleValueChange = (newValues: string[]) => {
  setSelectedValues(newValues);
};

/* Copy */
  const [copied, setCopied] = React.useState(false) // State untuk cek apakah teks sudah disalin
  const code = "234567" // Kode Absen

  // Fungsi untuk menyalin teks ke clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true) // Set state copied menjadi true
      toast("",{
        description: (
          <div className="flex items-start gap-3">
            {/* Icon di kiri */}
            <div className="w-7 h-7 flex items-center justify-center rounded-md border border-primary bg-primary">
              <Check className="text-background w-4 h-4" />
            </div>
            <div>
              {/* Judul dibuat lebih besar */}
              <p className="text-lg font-semibold text-foreground font-sans">Kode Disalin!</p>
              {/* Deskripsi dengan warna lebih muted */}
              <p className="text-sm text-muted-foreground font-sans">
                Lorem Ipsum Sir Dolot
              </p>
            </div>
          </div>
        ),
        action: {
          label: (
            <span className="font-sans px-3 py-1 text-sm font-medium border rounded-md border-border text-foreground">
              Tutup
            </span>
          ),
          onClick: () => console.log("Tutup"),
        },
      })
      setTimeout(() => setCopied(false), 2000) // Reset state setelah 2 detik
    })
  }

/* Toast success */
const handleSuccess = () => {
    navigator.clipboard.writeText(code).then(() => {
      toast("",{
        description: (
          <div className="flex items-start gap-3">
            {/* Icon di kiri */}
            <div className="w-7 h-7 flex items-center justify-center rounded-md border border-primary bg-primary">
              <Check className="text-background w-4 h-4" />
            </div>
            <div>
              {/* Judul dibuat lebih besar */}
              <p className="text-lg font-semibold text-foreground font-sans">Berhasil Logout</p>
              {/* Deskripsi dengan warna lebih muted */}
              <p className="text-sm text-muted-foreground font-sans">
                Lorem Ipsum Sir Dolot
              </p>
            </div>
          </div>
        ),
        action: {
          label: (
            <span className="font-sans px-3 py-1 text-sm font-medium border rounded-md border-border text-foreground">
              Tutup
            </span>
          ),
          onClick: () => console.log("Tutup"),
        },
      })
      setTimeout(() => setCopied(false), 2000) // Reset state setelah 2 detik
    })
}
  
    
/* Calendar */
  const [date, setDate] = React.useState<Date>()
  
  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Datatables
      </h2>
      <Button variant="outline" onClick={() => router.push("./sidebar-true/datatables")}>
            Lihat Datatables
      </Button>
      <div>
      <h1 className="scroll-m-20 [&:not(:first-child)]:mt-6 text-4xl font-extrabold tracking-tight lg:text-5xl">
        The Joke Tax Chronicles
      </h1>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        Once upon a time, in a far-off land, there was a very lazy king who
        spent all day lounging on his throne. One day, his advisors came to him
        with a problem: the kingdom was running out of money.
      </p>
      <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        The King's Plan
      </h2>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        The king thought long and hard, and finally came up with{" "}
        <a
          href="#"
          className="font-medium text-primary underline underline-offset-4"
        >
          a brilliant plan
        </a>
        : he would tax the jokes in the kingdom.
      </p>
      <blockquote className="mt-6 border-l-2 pl-6 italic">
        "After all," he said, "everyone enjoys a good joke, so it's only fair
        that they should pay for the privilege."
      </blockquote>
      <h3 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">
        The Joke Tax
      </h3>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        The king's subjects were not amused. They grumbled and complained, but
        the king was firm:
      </p>
      <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
        <li>1st level of puns: 5 gold coins</li>
        <li>2nd level of jokes: 10 gold coins</li>
        <li>3rd level of one-liners : 20 gold coins</li>
      </ul>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        As a result, people stopped telling jokes, and the kingdom fell into a
        gloom. But there was one person who refused to let the king's
        foolishness get him down: a court jester named Jokester.
      </p>
      <h3 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">
        Jokester's Revolt
      </h3>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        Jokester began sneaking into the castle in the middle of the night and
        leaving jokes all over the place: under the king's pillow, in his soup,
        even in the royal toilet. The king was furious, but he couldn't seem to
        stop Jokester.
      </p>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        And then, one day, the people of the kingdom discovered that the jokes
        left by Jokester were so funny that they couldn't help but laugh. And
        once they started laughing, they couldn't stop.
      </p>
      <h3 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">
        The People's Rebellion
      </h3>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        The people of the kingdom, feeling uplifted by the laughter, started to
        tell jokes and puns again, and soon the entire kingdom was in on the
        joke.
      </p>
      <div className="my-6 w-full overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr className="m-0 border-t p-0 even:bg-muted">
              <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
                King's Treasury
              </th>
              <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
                People's happiness
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="m-0 border-t p-0 even:bg-muted">
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                Empty
              </td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                Overflowing
              </td>
            </tr>
            <tr className="m-0 border-t p-0 even:bg-muted">
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                Modest
              </td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                Satisfied
              </td>
            </tr>
            <tr className="m-0 border-t p-0 even:bg-muted">
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                Full
              </td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                Ecstatic
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        The king, seeing how much happier his subjects were, realized the error
        of his ways and repealed the joke tax. Jokester was declared a hero, and
        the kingdom lived happily ever after.
      </p>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        The moral of the story is: never underestimate the power of a good laugh
        and always be careful of bad ideas.
      </p>
      </div>
      
      <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Contoh Button Variants
      </h2>
      
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
          
      
      <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Contoh Form
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Masukkan email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" type="submit">Submit</Button>
            <Button className="w-full" type="submit">Submit</Button>
          </div>
        </form>
      </Form>
          
      
      <h2 className="mt-4 text-lg font-semibold">Card Form</h2>

      <div className="flex gap-2">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Silakan masukkan data Anda</CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Masukkan email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              
             <FormItem className="space-y-2">
              <FormLabel>Birthdate</FormLabel>
              
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              
              <FormMessage />
            </FormItem>
            
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="siswa">Siswa</SelectItem>
                        <SelectItem value="guru">Guru</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {role === "siswa" && (
                <FormField
                  control={form.control}
                  name="angkatan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Angkatan</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih angkatan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2022">2022</SelectItem>
                          <SelectItem value="2023">2023</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

                <div className="pt-2">
                  <Button type="submit">Submit</Button>
                </div>
            </form>
          </Form>
        </CardContent>
        </Card>
        
        <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Silakan masukkan data Anda</CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />
                
              <div>
                <Label htmlFor="current_password">Current Password</Label>
                <PasswordInput
                  id="current_password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div>
                <Label htmlFor="password">New Password</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <Label htmlFor="password_confirmation">Confirm Password</Label>
                <PasswordInput
                  id="password_confirmation"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
                
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tingkat Pendidikan</FormLabel>
                    <FormControl className="flex">
                      <div className="flex gap-2 items-center">
                      <RadioGroup defaultValue="comfortable">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="default" id="r1" />
                        <Label htmlFor="r1">SD</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="comfortable" id="r2" />
                        <Label htmlFor="r2">SMP</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="compact" id="r3" />
                        <Label htmlFor="r3">SMA</Label>
                      </div>
                      </RadioGroup>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pilih Murid</FormLabel>
                    <FormControl>
                        <SelectPills
                          data={data}
                          value={selectedValues}
                          defaultValue={["Mickey"]}
                          onValueChange={handleValueChange}
                          placeholder="Cari nama murid, cth: Mickey Madison"
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />
                
            <div className="flex gap-2 pt-2">
              <Button variant="outline" type="submit">Kembali</Button>
              <Button className="w-full" type="submit">Submit</Button>
            </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      </div>

      
      <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Contoh Accordion
      </h2>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Bagaimana cara mendaftar?</AccordionTrigger>
          <AccordionContent>
            Untuk mendaftar, silakan isi formulir di atas dan klik tombol submit.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Apa manfaat akun ini?</AccordionTrigger>
          <AccordionContent>
            Dengan akun ini, Anda dapat mengakses fitur eksklusif dan mendapatkan pembaruan terbaru.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      
      <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Contoh Sooner
      </h2>

      <h2 className="mt-4 text-lg font-semibold">Sooner in Card</h2>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Silakan masukkan data Anda</CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Masukkan email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Toaster />
              <Button
              variant="outline"
              onClick={() =>
                toast("",{
                  description: (
                    <div className="flex items-start gap-3">
                      {/* Icon di kiri */}
                      <div className="w-7 h-7 flex items-center justify-center rounded-md border border-primary bg-primary">
                        <Check className="text-background w-4 h-4" />
                      </div>
                      <div>
                        {/* Judul dibuat lebih besar */}
                        <p className="text-lg font-semibold text-foreground font-sans">Event Created!</p>
                        {/* Deskripsi dengan warna lebih muted */}
                        <p className="text-sm text-muted-foreground font-sans">
                          Lorem Ipsum Sir Dolot
                        </p>
                      </div>
                    </div>
                  ),
                  action: {
                    label: (
                      <span className="font-sans px-3 py-1 text-sm font-medium border rounded-md border-border text-foreground">
                        Tutup
                      </span>
                    ),
                    onClick: () => console.log("Tutup"),
                  },
                })
              }
            >
              Show Toast
            </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      
      <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Contoh Popup Modal
      </h2>
      <Dialog>
      <DialogTrigger asChild>
        <div className="flex gap-2 pt-2">
          <Button variant="outline">Lihat Kode Absensi</Button>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kode Absen</DialogTitle>
          <DialogDescription>
            Anyone who has this link will be able to view this.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Kode Absen
            </Label>
              <Input
                className="text-xl md:text-3xl font-bold py-4 h-12"
                id="link"
              defaultValue="234567"
              readOnly
            />
          </div>
          <Button type="button" size="lg" className="px-3" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="w-5 h-5 mr-1 text-green-500" />
                Disalin!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 mr-1" />
                Salin
              </>
            )}
          </Button>
        </div>
        <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <div className="flex gap-2">
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </div>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
      </Dialog>
      
      <Dialog>
      <DialogTrigger asChild>
        <div className="flex gap-2 pt-2">
          <Button variant="outline">Keluar (Contoh 2 Button)</Button>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yakin mau keluar?</DialogTitle>
            <DialogDescription>
              Anda bisa mengakses ini lagi nanti.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <div className="flex gap-4">
                <Button type="button" onClick={handleSuccess} variant="secondary">
                  Ya
                </Button>
                <Button type="button" >
                  Tidak
                </Button>
              </div>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
      </Dialog>

      <Dialog>
      <DialogTrigger asChild>
        <div className="flex gap-2 pt-2">
          <Button variant="outline">Ubah Password</Button>
        </div>
      </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          
          <DialogHeader>
            <div className="fitems-center text-center">
              <div className="flex flex-col justify-center items-center text-center">
                <Lock className="flex items-center text-primary mb-2"></Lock>
                <DialogTitle className="flex text-center items-center mb-2">Ubah Password</DialogTitle>
              </div>
              <DialogDescription className="mb-4">
                Kamu bisa mengubah password yang beda dari sebelumnya.
                </DialogDescription>
            </div>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="current_password">Current Password</Label>
                <PasswordInput
                  id="current_password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div>
                <Label htmlFor="password">New Password</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </form>
        </Form>    
          </DialogHeader>
        <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <div className="flex gap-4 w-full">
                <Button type="button" variant="secondary">
                  Kembali
                </Button>
                <Button className="max-w-xs w-full" type="button" onClick={handleSuccess} >
                  Ubah
                </Button>
              </div>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </div>
    
  )
}
