import { Card, CardContent } from "@/components/ui/card";
import { ClockIcon } from "lucide-react";

interface TimeCardProps {
    time: string;
    timeZone: string;
}

const TimeCard: React.FC<TimeCardProps> = ({ time, timeZone }) => {
    return (
        <Card className="w-full">
            <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 rounded-full p-3">
                        <ClockIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-gray-900">
                            {time}
                        </h3>
                        <p className="text-sm text-gray-500">{timeZone}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TimeCard;
