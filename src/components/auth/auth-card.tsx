import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AppLogo } from "@/components/logo";

type AuthCardProps = {
  title: string
  description: string
  children: React.ReactNode
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <Card className="w-full max-w-md shadow-2xl bg-card">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-2 mb-4">
          <AppLogo className="w-10 h-10 text-primary" />
          <h1 className="text-2xl font-bold text-primary">Recaudo Seguro</h1>
        </div>
        <CardTitle className="text-3xl font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
