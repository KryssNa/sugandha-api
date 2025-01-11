// src/services/device.service.ts
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import { UserDocument } from '../models/user.model';

export class DeviceService {
    static parseUserAgent(userAgent: string) {
        const parser = new UAParser(userAgent);
        const result = parser.getResult();

        return {
            deviceType: result.device.type || 'unknown',
            browser: `${result.browser.name} ${result.browser.version}`,
            operatingSystem: `${result.os.name} ${result.os.version}`
        };
    }

    static getLocationFromIP(ip: string) {
        const geo = geoip.lookup(ip);
        return geo ? {
            city: geo.city,
            country: geo.country,
            latitude: geo.ll[0],
            longitude: geo.ll[1]
        } : {};
    }

    static async trackDeviceLogin(
        user: UserDocument,
        userAgent: string,
        ipAddress: string,
        os?:string,
    ) {
        const deviceInfo = this.parseUserAgent(userAgent);
        const location = this.getLocationFromIP(ipAddress);
        const deviceId = crypto.randomUUID();

        // Reset previous current device
        user.activeDevices.forEach(device => {
            device.isCurrentDevice = false;
        });

        // Check device limit
        if (user.activeDevices.length >= (user.maxDevices || 10)) {
            user.activeDevices.shift(); // Remove oldest device
        }

        // Add new device
        user.activeDevices.push({
            deviceId,
            ...deviceInfo,
            ipAddress,
            location,
            lastActive: new Date(),
            os,
            isCurrentDevice: true
        });

        await user.save();

        return deviceId;
    }

    static async invalidateDevice(
        user: UserDocument,
        deviceId: string
    ) {
        user.activeDevices = user.activeDevices.filter(
            device => device.deviceId !== deviceId
        );
        await user.save();
    }
    static async terminateAllSessions(user:UserDocument) {
        user.activeDevices = []; // Clear all sessions
        await user.save();
      }
}