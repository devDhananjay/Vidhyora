"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { returnRequestSchema, type ReturnRequestInput } from "@/lib/validations/return";
import { createReturnRequest } from "@/actions/orders/return-request";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ImageUpload } from "@/components/shared/image-upload";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, CheckCircle } from "lucide-react";

type ReturnRequestFormProps = {
  orderItem: any;
  order: any;
  eligibility: {
    canReturn: boolean;
    canReplace: boolean;
    reason?: string;
  };
};

export function ReturnRequestForm({ orderItem, order, eligibility }: ReturnRequestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ReturnRequestInput>({
    resolver: zodResolver(returnRequestSchema),
    defaultValues: {
      orderItemId: orderItem.id,
      type: eligibility.canReturn ? "RETURN" : "REPLACEMENT",
    },
  });

  const selectedType = watch("type");

  const onSubmit = async (data: ReturnRequestInput) => {
    startTransition(async () => {
      const result = await createReturnRequest({
        ...data,
        images,
      });

      if (result.success) {
        alert("Return/replacement request submitted successfully!");
        router.push(`/orders/${order.id}`);
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  };

  // If not eligible, show message
  if (!eligibility.canReturn && !eligibility.canReplace) {
    return (
      <Card className="mt-6">
        <CardContent className="py-12 text-center">
          <AlertCircle className="mx-auto mb-4 size-12 text-yellow-600" />
          <h3 className="mb-2 text-lg font-semibold">Not Eligible</h3>
          <p className="text-muted-foreground">
            {eligibility.reason || "This item is not eligible for return or replacement"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
      {/* Order Item Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {orderItem.product.thumbnail && (
              <div className="relative size-20 shrink-0 overflow-hidden rounded">
                <Image
                  src={orderItem.product.thumbnail}
                  alt={orderItem.productName}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h4 className="font-semibold">{orderItem.productName}</h4>
              <p className="text-sm text-muted-foreground">
                Quantity: {orderItem.quantity} × {formatCurrency(Number(orderItem.price))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request Type</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            onValueChange={(value: "RETURN" | "REPLACEMENT") => setValue("type", value)}
            defaultValue={selectedType}
          >
            {eligibility.canReturn && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="RETURN" id="return" />
                <Label htmlFor="return" className="cursor-pointer">
                  <div className="font-medium">Return for Refund</div>
                  <div className="text-sm text-muted-foreground">
                    Get a full refund for this item
                  </div>
                </Label>
              </div>
            )}
            {eligibility.canReplace && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="REPLACEMENT" id="replacement" />
                <Label htmlFor="replacement" className="cursor-pointer">
                  <div className="font-medium">Request Replacement</div>
                  <div className="text-sm text-muted-foreground">
                    Get a replacement for this item
                  </div>
                </Label>
              </div>
            )}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Reason */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reason</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="reason">Select Reason *</Label>
            <select
              id="reason"
              {...register("reason")}
              className="mt-2 w-full rounded-md border p-2"
            >
              <option value="">Choose a reason...</option>
              <option value="Defective or damaged">Defective or damaged</option>
              <option value="Wrong item received">Wrong item received</option>
              <option value="Item not as described">Item not as described</option>
              <option value="Size/fit issues">Size/fit issues</option>
              <option value="Changed mind">Changed mind</option>
              <option value="Other">Other</option>
            </select>
            {errors.reason && (
              <p className="mt-1 text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Please provide details about the issue..."
              rows={6}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Minimum 20 characters. Be as detailed as possible.
            </p>
            {errors.description && (
              <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Images (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Upload photos showing the issue (if applicable)
          </p>
          <ImageUpload
            value={images}
            onChange={setImages}
            maxFiles={5}
            maxSize={5}
          />
        </CardContent>
      </Card>

      {/* Important Information */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/10">
        <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
          Important Information
        </h4>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>• Your request will be reviewed within 24-48 hours</li>
          <li>• You'll receive an email notification once reviewed</li>
          <li>• Please keep the item in its original condition and packaging</li>
          <li>• Refunds will be processed within 5-7 business days after approval</li>
        </ul>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </form>
  );
}
