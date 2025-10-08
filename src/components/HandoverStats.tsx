import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, UserMinus, Users, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";

interface HandoverStatsProps {
  bedAssignments: any[];
}

export function HandoverStats({ bedAssignments }: HandoverStatsProps) {
  const [stats, setStats] = useState({
    admissions: 0,
    discharges: 0,
    currentPatients: 0,
    oxygenSupport: 0,
  });

  useEffect(() => {
    fetchDailyStats();
  }, [bedAssignments]);

  const fetchDailyStats = async () => {
    try {
      const today = new Date();
      const startDate = startOfDay(today).toISOString();
      const endDate = endOfDay(today).toISOString();

      // Get admissions today
      const { data: admissionsData } = await supabase
        .from("admissions")
        .select("id")
        .gte("admission_date", startDate)
        .lte("admission_date", endDate);

      // Get discharges today
      const { data: dischargesData } = await supabase
        .from("admissions")
        .select("id")
        .gte("discharge_date", startDate)
        .lte("discharge_date", endDate);

      // Count oxygen support from bed assignments
      const oxygenCount = bedAssignments.filter(
        (bed) => bed.admission?.oxygen_requirement && Object.keys(bed.admission.oxygen_requirement).length > 0
      ).length;

      setStats({
        admissions: admissionsData?.length || 0,
        discharges: dischargesData?.length || 0,
        currentPatients: bedAssignments.length,
        oxygenSupport: oxygenCount,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const statCards = [
    {
      title: "Ingresos Hoy",
      value: stats.admissions,
      icon: UserPlus,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      title: "Altas Hoy",
      value: stats.discharges,
      icon: UserMinus,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-950",
    },
    {
      title: "Pacientes Actuales",
      value: stats.currentPatients,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-950",
    },
    {
      title: "Con Soporte O2",
      value: stats.oxygenSupport,
      icon: Activity,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-950",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
