-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'PAID', 'COMPLETE');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MONTONIO', 'STRIPE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AttractionCategory" AS ENUM ('popular', 'gem');

-- CreateEnum
CREATE TYPE "HotelTier" AS ENUM ('budget', 'mid', 'comfort');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "customData" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userPlanId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerRef" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "event" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "styles" TEXT[],
    "bestSeason" TEXT NOT NULL,
    "imgUrl" TEXT NOT NULL,
    "heroImageUrl" TEXT NOT NULL,
    "currentWeather" TEXT NOT NULL DEFAULT '',
    "content" JSONB NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "radiusKm" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attraction" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "category" "AttractionCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "img" TEXT NOT NULL,
    "priceAndDuration" TEXT,
    "openingHours" TEXT,
    "bestTime" TEXT,
    "source" TEXT,
    "content" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "cuisine" TEXT,
    "price" TEXT NOT NULL,
    "openingHours" TEXT,
    "delivery" BOOLEAN NOT NULL DEFAULT false,
    "petFriendly" BOOLEAN NOT NULL DEFAULT false,
    "img" TEXT,
    "source" TEXT,
    "content" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hotel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "tier" "HotelTier" NOT NULL,
    "area" TEXT NOT NULL,
    "pricePerNight" INTEGER NOT NULL,
    "rating" TEXT NOT NULL,
    "img" TEXT NOT NULL,
    "source" TEXT,
    "content" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationAttraction" (
    "destinationId" TEXT NOT NULL,
    "attractionId" TEXT NOT NULL,

    CONSTRAINT "DestinationAttraction_pkey" PRIMARY KEY ("destinationId","attractionId")
);

-- CreateTable
CREATE TABLE "DestinationRestaurant" (
    "destinationId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,

    CONSTRAINT "DestinationRestaurant_pkey" PRIMARY KEY ("destinationId","restaurantId")
);

-- CreateTable
CREATE TABLE "DestinationHotel" (
    "destinationId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,

    CONSTRAINT "DestinationHotel_pkey" PRIMARY KEY ("destinationId","hotelId")
);

-- CreateTable
CREATE TABLE "Itinerary" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "days" JSONB NOT NULL DEFAULT '[]',
    "costs" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Itinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItinerarySegment" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "days" JSONB NOT NULL DEFAULT '[]',
    "costs" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ItinerarySegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadyPlan" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "imgUrl" TEXT NOT NULL,
    "badge" TEXT,
    "tags" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadyPlanPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readyPlanId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadyPlanPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "heroImgUrl" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "tags" TEXT[],
    "content" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "destinationName" TEXT,
    "tripDate" TEXT,
    "highlight" TEXT,
    "savedAmount" TEXT,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_family_idx" ON "RefreshToken"("family");

-- CreateIndex
CREATE INDEX "UserPlan_userId_idx" ON "UserPlan"("userId");

-- CreateIndex
CREATE INDEX "UserPlan_destinationId_idx" ON "UserPlan"("destinationId");

-- CreateIndex
CREATE INDEX "Purchase_userId_idx" ON "Purchase"("userId");

-- CreateIndex
CREATE INDEX "Purchase_providerRef_idx" ON "Purchase"("providerRef");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_event_idx" ON "AuditLog"("event");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Destination_name_idx" ON "Destination"("name");

-- CreateIndex
CREATE INDEX "Attraction_lat_lng_idx" ON "Attraction"("lat", "lng");

-- CreateIndex
CREATE INDEX "Restaurant_lat_lng_idx" ON "Restaurant"("lat", "lng");

-- CreateIndex
CREATE INDEX "Hotel_lat_lng_idx" ON "Hotel"("lat", "lng");

-- CreateIndex
CREATE INDEX "DestinationAttraction_destinationId_idx" ON "DestinationAttraction"("destinationId");

-- CreateIndex
CREATE INDEX "DestinationAttraction_attractionId_idx" ON "DestinationAttraction"("attractionId");

-- CreateIndex
CREATE INDEX "DestinationRestaurant_destinationId_idx" ON "DestinationRestaurant"("destinationId");

-- CreateIndex
CREATE INDEX "DestinationRestaurant_restaurantId_idx" ON "DestinationRestaurant"("restaurantId");

-- CreateIndex
CREATE INDEX "DestinationHotel_destinationId_idx" ON "DestinationHotel"("destinationId");

-- CreateIndex
CREATE INDEX "DestinationHotel_hotelId_idx" ON "DestinationHotel"("hotelId");

-- CreateIndex
CREATE INDEX "ItinerarySegment_itineraryId_idx" ON "ItinerarySegment"("itineraryId");

-- CreateIndex
CREATE INDEX "ItinerarySegment_destinationId_idx" ON "ItinerarySegment"("destinationId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadyPlan_itineraryId_key" ON "ReadyPlan"("itineraryId");

-- CreateIndex
CREATE INDEX "ReadyPlanPurchase_userId_idx" ON "ReadyPlanPurchase"("userId");

-- CreateIndex
CREATE INDEX "ReadyPlanPurchase_readyPlanId_idx" ON "ReadyPlanPurchase"("readyPlanId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPlan" ADD CONSTRAINT "UserPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userPlanId_fkey" FOREIGN KEY ("userPlanId") REFERENCES "UserPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationAttraction" ADD CONSTRAINT "DestinationAttraction_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationAttraction" ADD CONSTRAINT "DestinationAttraction_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "Attraction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationRestaurant" ADD CONSTRAINT "DestinationRestaurant_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationRestaurant" ADD CONSTRAINT "DestinationRestaurant_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationHotel" ADD CONSTRAINT "DestinationHotel_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationHotel" ADD CONSTRAINT "DestinationHotel_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItinerarySegment" ADD CONSTRAINT "ItinerarySegment_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItinerarySegment" ADD CONSTRAINT "ItinerarySegment_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadyPlan" ADD CONSTRAINT "ReadyPlan_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadyPlanPurchase" ADD CONSTRAINT "ReadyPlanPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadyPlanPurchase" ADD CONSTRAINT "ReadyPlanPurchase_readyPlanId_fkey" FOREIGN KEY ("readyPlanId") REFERENCES "ReadyPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
